using Volo.Abp.Modularity;

namespace KhoThietBi;

[DependsOn(
    typeof(KhoThietBiDomainModule),
    typeof(KhoThietBiTestBaseModule)
)]
public class KhoThietBiDomainTestModule : AbpModule
{

}
