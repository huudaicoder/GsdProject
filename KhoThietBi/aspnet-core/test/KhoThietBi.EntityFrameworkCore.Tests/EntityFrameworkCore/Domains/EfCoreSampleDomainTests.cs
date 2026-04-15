using KhoThietBi.Samples;
using Xunit;

namespace KhoThietBi.EntityFrameworkCore.Domains;

[Collection(KhoThietBiTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<KhoThietBiEntityFrameworkCoreTestModule>
{

}
