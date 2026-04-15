using KhoThietBi.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace KhoThietBi.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class KhoThietBiController : AbpControllerBase
{
    protected KhoThietBiController()
    {
        LocalizationResource = typeof(KhoThietBiResource);
    }
}
