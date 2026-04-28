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
                job.Progress = 5;
                _jobManagementService.UpdateJob(job);

                // Use Umbraco's temp directory
                var umbracoTempPath = Path.Combine(_env.ContentRootPath, "umbraco", "Data", "Temp", "Squeeze");
                var tempDir = Path.Combine(umbracoTempPath, $"{job.Id}");
                Directory.CreateDirectory(tempDir);

                try
                {
                    // Create zip file
                    var zipPath = Path.Combine(tempDir, $"media-{job.MediaGuid:N}.zip");
                    long totalUncompressedSize = 0;
                    long totalCompressedSize = 0;
                    int totalFiles = 0;
                    int processedFiles = 0;

                    // Use the compression level from the job directly
                    var compressionLevel = job.CompressionLevel;

                    job.Message = "Counting files...";
                    job.Progress = 10;
                    _jobManagementService.UpdateJob(job);

                    // First pass: count total files across all selected media items
                    foreach (var mediaGuid in job.MediaGuids)
                    {
                        var media = _mediaService.GetById(mediaGuid);
                        if (media == null) continue;

                        if (IsFolderMediaType(media))
                        {
                            // Traverse folder recursively to count files
                            await _mediaTraversalService.TraverseMediaFolderStreamingAsync(
                                media,
                                media.Name ?? "Unnamed",
                                job,
                                async (stream, entryName, fileSize) =>
                                {
                                    totalFiles++;
                                    await Task.CompletedTask;
                                });
                        }
                        else
                        {
                            // Single file
                            totalFiles++;
                        }
                    }

                    if (totalFiles == 0)
                    {
                        job.Status = CompressionStatus.Failed;
                        job.Error = "No media files found in the selected items";
                        _jobManagementService.UpdateJob(job);
                        return;
                    }

                    job.Message = $"Creating archive with {totalFiles} files...";
                    job.Progress = 15;
                    _jobManagementService.UpdateJob(job);

                    // Second pass: actually compress files
                    using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create, System.Text.Encoding.UTF8))
                    {
                        foreach (var mediaGuid in job.MediaGuids)
                        {
                            var media = _mediaService.GetById(mediaGuid);
                            if (media == null) continue;

                            if (IsFolderMediaType(media))
                            {
                                // Traverse folder recursively and add files to zip
                                await _mediaTraversalService.TraverseMediaFolderStreamingAsync(
                                    media,
                                    media.Name ?? "Unnamed",
                                    job,
                                    async (stream, entryName, fileSize) =>
                                    {
                                        try
                                        {
                                            totalUncompressedSize += fileSize;

                                            // Create zip entry from stream with selected compression level
                                            var entry = zip.CreateEntry(entryName, compressionLevel);
                                            using var entryStream = entry.Open();
                                            await stream.CopyToAsync(entryStream);

                                            processedFiles++;

                                            // Update progress (15% to 85%)
                                            job.Progress = 15 + (int)((processedFiles / (double)totalFiles) * 70);
                                            job.Message = $"Squeezing file {processedFiles} of {totalFiles}: {Path.GetFileName(entryName)}";
                                            _jobManagementService.UpdateJob(job);
                                        }
                                        finally
                                        {
                                            stream.Dispose();
                                        }
                                    });
                            }
                            else
                            {
                                // Single file - include directly
                                var stream = await _mediaTraversalService.GetMediaStreamAsync(media);
                                if (stream != null)
                                {
                                    try
                                    {
                                        var fileName = _mediaTraversalService.GetMediaFileName(media);
                                        long fileSize = 0;
                                        try
                                        {
                                            if (stream.CanSeek) fileSize = stream.Length;
                                        }
                                        catch { }

                                        totalUncompressedSize += fileSize;

                                        var entry = zip.CreateEntry(fileName, compressionLevel);
                                        using var entryStream = entry.Open();
                                        await stream.CopyToAsync(entryStream);

                                        processedFiles++;

                                        job.Progress = 15 + (int)((processedFiles / (double)totalFiles) * 70);
                                        job.Message = $"Squeezing file {processedFiles} of {totalFiles}: {fileName}";
                                        _jobManagementService.UpdateJob(job);
                                    }
                                    finally
                                    {
                                        stream.Dispose();
                                    }
                                }
                            }
                        }

                        // Add info.txt file with compression details
                        var infoEntry = zip.CreateEntry("compression-info.txt", CompressionLevel.NoCompression);
                        await CreateCompressionInfo(job, totalFiles, totalUncompressedSize, infoEntry);
                    }

                    // Get compressed size after zip is created
                    var zipFileInfo = new FileInfo(zipPath);
                    totalCompressedSize = zipFileInfo.Length;

                    // Update the info.txt file with compressed size
                    using (var zip = ZipFile.Open(zipPath, ZipArchiveMode.Update, System.Text.Encoding.UTF8))
                    {
                        var infoEntry = zip.GetEntry("compression-info.txt");
                        if (infoEntry != null)
                        {
                            infoEntry.Delete();
                        }

                        infoEntry = zip.CreateEntry("compression-info.txt", CompressionLevel.NoCompression);
                        await UpdateCompressionInfo(job, totalFiles, totalUncompressedSize, totalCompressedSize, infoEntry);
                    }

                    job.Message = "Finalizing...";
                    job.Progress = 95;
                    _jobManagementService.UpdateJob(job);

                    job.FilePath = zipPath;
                    job.Status = CompressionStatus.Completed;
                    job.Progress = 100;
                    job.Message = $"Squeezing completed. {totalFiles} files archived.";
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

        private bool IsFolderMediaType(IMedia media)
        {
            return media.ContentType.Alias.Equals("Folder", StringComparison.OrdinalIgnoreCase);
        }

        private static string GetCompressionLevelDisplayName(CompressionLevel level)
        {
            return level switch
            {
                CompressionLevel.Optimal => "Optimal",
                CompressionLevel.Fastest => "Fastest",
                CompressionLevel.NoCompression => "No Compression",
                CompressionLevel.SmallestSize => "Smallest Size",
                _ => level.ToString()
            };
        }

        private async Task CreateCompressionInfo(CompressionJob job,
            int totalFiles,
            long totalUncompressedSize, ZipArchiveEntry infoEntry)
        {
            using var writer = new StreamWriter(infoEntry.Open(), System.Text.Encoding.UTF8);
            await writer.WriteLineAsync($"Media Compression Report");
            await writer.WriteLineAsync($"================================");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Selected Items ({job.MediaGuids.Count}):");
            foreach (var guid in job.MediaGuids)
            {
                var media = _mediaService.GetById(guid);
                var name = media?.Name ?? "Unknown";
                var type = media != null && IsFolderMediaType(media) ? "Folder" : "File";
                await writer.WriteLineAsync($"  - {name} ({type}) [{guid:N}]");
            }
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"File Statistics:");
            await writer.WriteLineAsync($"  Total Files: {totalFiles}");
            await writer.WriteLineAsync($"  Total Uncompressed Size: {FormatFileSize(totalUncompressedSize)}");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Details:");
            await writer.WriteLineAsync($"  Compression Level: {GetCompressionLevelDisplayName(job.CompressionLevel)}");
            await writer.WriteLineAsync($"  Archive Format: ZIP");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Generated by UmbMediaSqueeze");
        }

        private async Task UpdateCompressionInfo(CompressionJob job,
            int totalFiles,
            long totalUncompressedSize, long totalCompressedSize, ZipArchiveEntry infoEntry)
        {
            using var writer = new StreamWriter(infoEntry.Open(), System.Text.Encoding.UTF8);
            await writer.WriteLineAsync($"Media Compression Report");
            await writer.WriteLineAsync($"================================");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Selected Items ({job.MediaGuids.Count}):");
            foreach (var guid in job.MediaGuids)
            {
                var media = _mediaService.GetById(guid);
                var name = media?.Name ?? "Unknown";
                var type = media != null && IsFolderMediaType(media) ? "Folder" : "File";
                await writer.WriteLineAsync($"  - {name} ({type}) [{guid:N}]");
            }
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"File Statistics:");
            await writer.WriteLineAsync($"  Total Files: {totalFiles}");
            await writer.WriteLineAsync($"  Total Uncompressed Size: {FormatFileSize(totalUncompressedSize)}");
            await writer.WriteLineAsync($"  Total Compressed Size: {FormatFileSize(totalCompressedSize)}");
            if (totalUncompressedSize > 0)
            {
                var compressionRatio = (double)totalCompressedSize / totalUncompressedSize * 100;
                await writer.WriteLineAsync($"  Compression Ratio: {compressionRatio:0.##}%");
            }
            await writer.WriteLineAsync($"");
            await writer.WriteLineAsync($"Compression Details:");
            await writer.WriteLineAsync($"  Compression Level: {GetCompressionLevelDisplayName(job.CompressionLevel)}");
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
