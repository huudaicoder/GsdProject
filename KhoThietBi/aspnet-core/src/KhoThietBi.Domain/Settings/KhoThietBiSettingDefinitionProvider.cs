using Volo.Abp.Settings;

namespace KhoThietBi.Settings;

public class KhoThietBiSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(KhoThietBiSettings.MySetting1));
    }
}
