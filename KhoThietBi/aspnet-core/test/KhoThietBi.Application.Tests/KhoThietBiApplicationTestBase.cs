using Volo.Abp.Modularity;

namespace KhoThietBi;

public abstract class KhoThietBiApplicationTestBase<TStartupModule> : KhoThietBiTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
