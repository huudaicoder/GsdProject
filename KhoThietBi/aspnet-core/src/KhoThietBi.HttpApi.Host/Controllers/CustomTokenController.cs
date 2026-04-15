using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.OpenIddict.Controllers;
using Microsoft.AspNetCore;

namespace KhoThietBi.Controllers;

/// <summary>
/// D-10: Custom token controller that returns specific Vietnamese error messages
/// distinguishing "user not found" from "wrong password".
/// </summary>
[Dependency(ReplaceServices = true)]
[ExposeServices(typeof(TokenController))]
public class CustomTokenController : TokenController
{
    private readonly IdentityUserManager _userManager;

    public CustomTokenController(IdentityUserManager userManager)
    {
        _userManager = userManager;
    }

    [HttpPost("connect/token")]
    public override async Task<IActionResult> HandleAsync()
    {
        var request = HttpContext.GetOpenIddictServerRequest();
        if (request == null || !request.IsPasswordGrantType())
        {
            return await base.HandleAsync();
        }

        // Check if user exists first (D-10: distinguish "user not found" vs "wrong password")
        var user = await _userManager.FindByNameAsync(request.Username ?? string.Empty);
        if (user == null)
        {
            var properties = new AuthenticationProperties(new Dictionary<string, string?>
            {
                [OpenIddictServerAspNetCoreConstants.Properties.Error] =
                    OpenIddictConstants.Errors.InvalidGrant,
                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
                    "Tai khoan khong ton tai. Vui long kiem tra lai ten dang nhap."
            });
            return Forbid(properties, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        // Check password (D-10: specific error for wrong password)
        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password ?? string.Empty);
        if (!passwordValid)
        {
            var properties = new AuthenticationProperties(new Dictionary<string, string?>
            {
                [OpenIddictServerAspNetCoreConstants.Properties.Error] =
                    OpenIddictConstants.Errors.InvalidGrant,
                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
                    "Mat khau khong dung. Vui long thu lai."
            });
            return Forbid(properties, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        // Valid credentials — delegate to base for standard OpenIddict token generation
        return await base.HandleAsync();
    }
}
