using KhoThietBi.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace KhoThietBi.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(KhoThietBiEntityFrameworkCoreModule),
    typeof(KhoThietBiApplicationContractsModule)
    )]
public class KhoThietBiDbMigratorModule : AbpModule
{
}
