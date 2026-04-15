using Volo.Abp.Modularity;

namespace KhoThietBi;

/* Inherit from this class for your domain layer tests. */
public abstract class KhoThietBiDomainTestBase<TStartupModule> : KhoThietBiTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
