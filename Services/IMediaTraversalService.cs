using UmbMediaSqueeze.Models;
using Umbraco.Cms.Core.Models;

namespace UmbMediaSqueeze.Services
{
    public interface IMediaTraversalService
    {
        Task<List<(Stream Stream, string EntryName, long FileSize)>> TraverseMediaFolderAsync(
            IMedia media,
            string? currentPath,
            CompressionJob job);

        Task<Stream?> GetMediaStreamAsync(IMedia media);

        string GetMediaFileName(IMedia media);
    }
}
