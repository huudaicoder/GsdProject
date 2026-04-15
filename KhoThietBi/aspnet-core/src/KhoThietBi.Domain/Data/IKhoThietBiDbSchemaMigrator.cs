using System.Threading.Tasks;

namespace KhoThietBi.Data;

public interface IKhoThietBiDbSchemaMigrator
{
    Task MigrateAsync();
}
