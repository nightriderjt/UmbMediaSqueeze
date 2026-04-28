using System.IO.Compression;

namespace UmbMediaSqueeze.Models
{
    public class SqueezePostModel
    {
        public Guid[]? MediaGuids { get; set; }
        public CompressionLevel? CompressionLevel { get; set; }
    }
}
