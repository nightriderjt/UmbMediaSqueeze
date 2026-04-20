using Microsoft.AspNetCore.Hosting;
using System.IO.Compression;
using UmbMediaSqueeze.Models;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace UmbMediaSqueeze.Services
{
    public class MediaCompressionService : IMediaCompressionService
    {
        private readonly IMediaService _mediaService;
        private readonly IMediaTraversalService _mediaTraversalService;
        private readonly IJobManagementService _jobManagementService;
        private readonly IWebHostEnvironment _env;

        public MediaCompressionService(
            IMediaService mediaService,
            IMediaTraversalService mediaTraversalService,
            IJobManagementService jobManagementService,
            IWebHostEnvironment env)
        {
            _mediaService = mediaService;
            _mediaTraversalService = mediaTraversalService;
            _jobManagementService = jobManagementService;
            _env = env;
        }

        public async Task CompressMediaAsync(CompressionJob job)
        {
            try
            {
                job.Status = CompressionStatus.Processing;
                job.Message = "Preparing files...";
                job.Progress = 10;
                _jobManagementService.UpdateJob(job);

                // Get media item
                var media = _mediaService.GetById(job.MediaGuid);
                if (media == null)
                {
                    job.Status = CompressionStatus.Failed;
                    job.Error = "Media not found";
                    _jobManagementService.UpdateJob(job);
                    return;
                }

                // Check if media is a folder (has children)
                var children = _mediaService.GetPagedChildren(media.Id, 0, 1, out var totalChildren);
                if (totalChildren == 0)
                {
                    job.Status = CompressionStatus.Failed;
                    job.Error = "Selected media is not a folder or has no children";
                    _jobManagementService.UpdateJob(job);
                    return;
                }

                // Use Umbraco's temp directory
                var umbracoTempPath = Path.Combine(_env.ContentRootPath, "umbraco", "Data", "Temp", "Squeeze");
                var tempDir = Path.Combine(umbracoTempPath, $"{job.Id}");
                Directory.CreateDirectory(tempDir);

                try
                {
                    // Collect media files recursively
                    job.Message = "Collecting files...";
                    job.Progress = 20;
                    _jobManagementService.UpdateJob(job);

                    var mediaStreams = await _mediaTraversalService.TraverseMediaFolderAsync(media, media.Name ?? "MediaFolder", job);

                    if (mediaStreams.Count == 0)
                    {
                        job.Status = CompressionStatus.Failed;
                        job.Error = "No media files found in the folder";
                        _jobManagementService.UpdateJob(job);
                        return;
                    }

                    job.Message = $"Creating archive with {mediaStreams.Count} files...";
                    job.Progress = 30;
                    _jobManagementService.UpdateJob(job);

                    // Create zip file
                    var zipPath = Path.Combine(tempDir, $"media-{job.MediaGuid}.zip");
                    long totalUncompressedSize = 0;
                    long totalCompressedSize = 0;

                    using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create, System.Text.Encoding.UTF8))
                    {
                        int processedFiles = 0;
                        foreach (var (stream, entryName, fileSize) in mediaStreams)
                        {
                            try
                            {
                                totalUncompressedSize += fileSize;

                                // Create zip entry from stream
                                var entry = zip.CreateEntry(entryName, CompressionLevel.SmallestSize);
                                using var entryStream = entry.Open();
                                await stream.CopyToAsync(entryStream);
                            }
                            finally
                            {
                                stream.Dispose();
                            }

                            processedFiles++;

                            // Update progress
                            job.Progress = 30 + (int)((processedFiles / (double)mediaStreams.Count) * 50);
                            job.Message = $"Squeezing file {processedFiles} of {mediaStreams.Count}: {Path.GetFileName(entryName)}";
                            _jobManagementService.UpdateJob(job);
                        }

                        // Add info.txt file with compression details
                        var infoEntry = zip.CreateEntry("compression-info.txt", CompressionLevel.NoCompression);
                        await CreateCompressionInfo(job, media, mediaStreams, totalUncompressedSize, infoEntry);
                    }

                    // Get compressed size after zip is created
                    var zipFileInfo = new FileInfo(zipPath);
                    totalCompressedSize = zipFileInfo.Length;

                    // Update the info.txt file with compressed size
                    // We need to reopen the zip file to update the info.txt
                    using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Update, System.Text.Encoding.UTF8))
                    {
                        var infoEntry = zip.GetEntry("compression-info.txt");
                        if (infoEntry != null)
                        {
                            infoEntry.Delete();
                        }

                        infoEntry = zip.CreateEntry("compression-info.txt", CompressionLevel.NoCompression);
                        await UpdateCompressionInfo(job, media, mediaStreams, totalUncompressedSize, totalCompressedSize, infoEntry);
                    }

                    job.Message = "Finalizing...";
                    job.Progress = 90;
                    _jobManagementService.UpdateJob(job);

                    job.FilePath = zipPath;
                    job.Status = CompressionStatus.Completed;
                    job.Progress = 100;
                    job.Message = $"Squeezing completed. {mediaStreams.Count} files archived.";
                    job.CompletionTime = DateTime.UtcNow;
                    _jobManagementService.UpdateJob(job);
                }
                finally
                {
                    // Clean up temp directory (except the zip file which will be deleted after download)
                    try
                    {
                        var files = Directory.GetFiles(tempDir);
                        foreach (var file in files)
                        {
                            if (file != job.FilePath)
                            {
                                System.IO.File.Delete(file);
                            }
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                job.Status = CompressionStatus.Failed;
                job.Error = ex.Message;
                job.Message = "Squeezing failed";
                _jobManagementService.UpdateJob(job);
            }
        }

        private async Task CreateCompressionInfo(CompressionJob job, IMedia media,
            System.Collections.Generic.List<(System.IO.Stream Stream, string EntryName, long FileSize)> mediaStreams,
            long totalUncompressedSize, ZipArchiveEntry infoEntry)
        {
            using var writer = new StreamWriter(infoEntry.Open(), System.Text.Encoding.UTF8);
            await writer.WriteLineAsync($"Media Folder Compression Report");
            await writer.WriteLineAsync($"================================");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Folder Name: {media.Name}");
            await writer.WriteLineAsync($"Media GUID: {job.MediaGuid}");
            await writer.WriteLineAsync($"Compression Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"File Statistics:");
            await writer.WriteLineAsync($"  Total Files: {mediaStreams.Count}");
            await writer.WriteLineAsync($"  Total Uncompressed Size: {FormatFileSize(totalUncompressedSize)}");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Details:");
            await writer.WriteLineAsync($"  Compression Level: Smallest Size");
            await writer.WriteLineAsync($"  Archive Format: ZIP");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Generated by UmbMediaSqueeze");
        }

        private async Task UpdateCompressionInfo(CompressionJob job, IMedia media,
            System.Collections.Generic.List<(System.IO.Stream Stream, string EntryName, long FileSize)> mediaStreams,
            long totalUncompressedSize, long totalCompressedSize, ZipArchiveEntry infoEntry)
        {
            using var writer = new StreamWriter(infoEntry.Open(), System.Text.Encoding.UTF8);
            await writer.WriteLineAsync($"Media Folder Compression Report");
            await writer.WriteLineAsync($"================================");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Folder Name: {media.Name}");
            await writer.WriteLineAsync($"Media GUID: {job.MediaGuid}");
            await writer.WriteLineAsync($"Compression Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"File Statistics:");
            await writer.WriteLineAsync($"  Total Files: {mediaStreams.Count}");
            await writer.WriteLineAsync($"  Total Uncompressed Size: {FormatFileSize(totalUncompressedSize)}");
            await writer.WriteLineAsync($"  Total Compressed Size: {FormatFileSize(totalCompressedSize)}");
            if (totalUncompressedSize > 0)
            {
                var compressionRatio = (double)totalCompressedSize / totalUncompressedSize * 100;
                await writer.WriteLineAsync($"  Compression Ratio: {compressionRatio:0.##}%");
            }
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Details:");
            await writer.WriteLineAsync($"  Compression Level: Smallest Size");
            await writer.WriteLineAsync($"  Archive Format: ZIP");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Generated by UmbMediaSqueeze");
        }

        public string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}