using Microsoft.Extensions.DependencyInjection;
using UmbMediaSqueeze.Services;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace UmbMediaSqueeze.Composers
{
    public class UmbMediaSqueezeComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            // Register services
            builder.Services.AddSingleton<IJobManagementService, JobManagementService>();
            builder.Services.AddScoped<IMediaTraversalService, MediaTraversalService>();
            builder.Services.AddScoped<IMediaCompressionService, MediaCompressionService>();
        }
    }
}
