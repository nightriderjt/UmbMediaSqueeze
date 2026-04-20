using UmbMediaSqueeze.Models;

namespace UmbMediaSqueeze.Services
{
    public interface IMediaCompressionService
    {
        Task CompressMediaAsync(CompressionJob job);

        string FormatFileSize(long bytes);
    }
}