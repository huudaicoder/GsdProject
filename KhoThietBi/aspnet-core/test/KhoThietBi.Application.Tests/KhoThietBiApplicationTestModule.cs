using Volo.Abp.Modularity;

namespace KhoThietBi;

[DependsOn(
    typeof(KhoThietBiApplicationModule),
    typeof(KhoThietBiDomainTestModule)
)]
public class KhoThietBiApplicationTestModule : AbpModule
{

}
