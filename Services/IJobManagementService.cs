using System.IO.Compression;
using UmbMediaSqueeze.Models;

namespace UmbMediaSqueeze.Services
{
    public interface IJobManagementService
    {
        CompressionJob CreateJob(IEnumerable<Guid> mediaGuids, CompressionLevel compressionLevel = CompressionLevel.SmallestSize);
        CompressionJob? GetJob(Guid jobId);
        void UpdateJob(CompressionJob job);
        void RemoveJob(Guid jobId);
        bool JobExists(Guid jobId);
    }
}
