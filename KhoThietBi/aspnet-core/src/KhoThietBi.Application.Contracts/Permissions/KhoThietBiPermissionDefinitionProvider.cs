using KhoThietBi.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace KhoThietBi.Permissions;

public class KhoThietBiPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(KhoThietBiPermissions.GroupName);
        //Define your own permissions here. Example:
        //myGroup.AddPermission(KhoThietBiPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<KhoThietBiResource>(name);
    }
}
