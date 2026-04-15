using System;
using System.Collections.Generic;
using System.Text;
using KhoThietBi.Localization;
using Volo.Abp.Application.Services;

namespace KhoThietBi;

/* Inherit your application services from this class.
 */
public abstract class KhoThietBiAppService : ApplicationService
{
    protected KhoThietBiAppService()
    {
        LocalizationResource = typeof(KhoThietBiResource);
    }
}
