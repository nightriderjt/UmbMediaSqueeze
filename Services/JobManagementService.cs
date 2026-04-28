using System.Collections.Concurrent;
using System.IO.Compression;
using UmbMediaSqueeze.Models;

namespace UmbMediaSqueeze.Services
{
    public class JobManagementService : IJobManagementService
    {
        private readonly ConcurrentDictionary<Guid, CompressionJob> _jobs = new();
        private readonly object _lock = new();

        public CompressionJob CreateJob(IEnumerable<Guid> mediaGuids, CompressionLevel compressionLevel = CompressionLevel.SmallestSize)
        {
            var guidList = mediaGuids.ToList();
            var jobId = Guid.NewGuid();
            var job = new CompressionJob
            {
                Id = jobId,
                MediaGuid = guidList.FirstOrDefault(),
                MediaGuids = guidList,
                Status = CompressionStatus.Queued,
                Progress = 0,
                StartTime = DateTime.UtcNow,
                CompressionLevel = compressionLevel
            };

            _jobs[jobId] = job;
            return job;
        }

        public CompressionJob? GetJob(Guid jobId)
        {
            _jobs.TryGetValue(jobId, out var job);
            return job;
        }

        public void UpdateJob(CompressionJob job)
        {
            if (job == null) throw new ArgumentNullException(nameof(job));

            lock (_lock)
            {
                if (_jobs.ContainsKey(job.Id))
                {
                    _jobs[job.Id] = job;
                }
            }
        }

        public void RemoveJob(Guid jobId)
        {
            _jobs.TryRemove(jobId, out _);
        }

        public bool JobExists(Guid jobId)
        {
            return _jobs.ContainsKey(jobId);
        }
    }
}
