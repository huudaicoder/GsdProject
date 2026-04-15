using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using KhoThietBi.Data;
using Volo.Abp.DependencyInjection;

namespace KhoThietBi.EntityFrameworkCore;

public class EntityFrameworkCoreKhoThietBiDbSchemaMigrator
    : IKhoThietBiDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreKhoThietBiDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the KhoThietBiDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<KhoThietBiDbContext>()
            .Database
            .MigrateAsync();
    }
}
