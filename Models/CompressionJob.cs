using System.IO.Compression;

namespace UmbMediaSqueeze.Models
{
    public class CompressionJob
    {
        public Guid Id { get; set; }
        public Guid MediaGuid { get; set; }
        public List<Guid> MediaGuids { get; set; } = new();
        public CompressionStatus Status { get; set; }
        public int Progress { get; set; }
        public string? Message { get; set; }
        public string? Error { get; set; }
        public string? FilePath { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? CompletionTime { get; set; }
        public string? CurrentFile { get; set; }
        public CompressionLevel CompressionLevel { get; set; } = CompressionLevel.SmallestSize;
    }
}
