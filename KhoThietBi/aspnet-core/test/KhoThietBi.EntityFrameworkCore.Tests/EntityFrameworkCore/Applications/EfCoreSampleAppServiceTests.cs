using KhoThietBi.Samples;
using Xunit;

namespace KhoThietBi.EntityFrameworkCore.Applications;

[Collection(KhoThietBiTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<KhoThietBiEntityFrameworkCoreTestModule>
{

}
