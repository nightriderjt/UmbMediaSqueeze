using UmbMediaSqueeze.Models;

namespace UmbMediaSqueeze.Services
{
    public interface IJobManagementService
    {
        CompressionJob CreateJob(Guid mediaGuid);
        CompressionJob? GetJob(Guid jobId);
        void UpdateJob(CompressionJob job);
        void RemoveJob(Guid jobId);
        bool JobExists(Guid jobId);
    }
}
