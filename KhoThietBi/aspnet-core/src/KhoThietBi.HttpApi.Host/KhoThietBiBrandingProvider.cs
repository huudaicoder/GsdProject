using Microsoft.Extensions.Localization;
using KhoThietBi.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace KhoThietBi;

[Dependency(ReplaceServices = true)]
public class KhoThietBiBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<KhoThietBiResource> _localizer;

    public KhoThietBiBrandingProvider(IStringLocalizer<KhoThietBiResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
