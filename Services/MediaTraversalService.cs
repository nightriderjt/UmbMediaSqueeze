using Microsoft.AspNetCore.Hosting;
using System.Text.Json;
using UmbMediaSqueeze.Models;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace UmbMediaSqueeze.Services
{
    public class MediaTraversalService : IMediaTraversalService
    {
        private readonly IMediaService _mediaService;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IWebHostEnvironment _env;

        public MediaTraversalService(
            IMediaService mediaService,
            MediaFileManager mediaFileManager,
            IWebHostEnvironment env)
        {
            _mediaService = mediaService;
            _mediaFileManager = mediaFileManager;
            _env = env;
        }

        public async Task<List<(Stream Stream, string EntryName, long FileSize)>> TraverseMediaFolderAsync(
            IMedia media, string? currentPath, CompressionJob job)
        {
            var mediaStreams = new List<(Stream Stream, string EntryName, long FileSize)>();

            // Get all children of this media item
            var page = 0;
            const int pageSize = 100;

            while (true)
            {
                var children = _mediaService.GetPagedChildren(media.Id, page, pageSize, out var total);

                foreach (var child in children)
                {
                    // Check if child is a folder (has children of its own)
                    var childChildren = _mediaService.GetPagedChildren(child.Id, 0, 1, out var childTotal);

                    if (childTotal > 0)
                    {
                        // This is a subfolder, traverse recursively
                        var childName = child.Name ?? "Unnamed";
                        var childPath = string.IsNullOrEmpty(currentPath) ? childName : Path.Combine(currentPath, childName);
                        var subStreams = await TraverseMediaFolderAsync(child, childPath, job);
                        mediaStreams.AddRange(subStreams);
                    }
                    else
                    {
                        job.CurrentFile = child.Name ?? "Unnamed";
                        // This is a media file, try to get its content as a stream
                        var stream = await GetMediaStreamAsync(child);
                        if (stream != null)
                        {
                            // Get the actual filename from media properties
                            var fileName = GetMediaFileName(child);
                            var entryName = string.IsNullOrEmpty(currentPath)
                                ? fileName
                                : Path.Combine(currentPath, fileName);

                            // Try to get file size if possible
                            long fileSize = 0;
                            try
                            {
                                if (stream.CanSeek)
                                {
                                    fileSize = stream.Length;
                                }
                                else
                                {
                                    // For non-seekable streams, we'll estimate or use 0
                                    fileSize = 0;
                                }
                            }
                            catch
                            {
                                fileSize = 0;
                            }

                            mediaStreams.Add((stream, entryName, fileSize));

                            // Update progress message periodically
                            if (mediaStreams.Count % 10 == 0)
                            {
                                job.Message = $"Collected {mediaStreams.Count} files...";
                            }
                        }
                    }
                }

                page++;
                if (page * pageSize >= total)
                {
                    break;
                }
            }

            return mediaStreams;
        }

        public async Task<Stream?> GetMediaStreamAsync(IMedia media)
        {
            try
            {
                // First, check if this media has a "umbracoFile" property (standard for file media)
                if (media.Properties.TryGetValue("umbracoFile", out var umbracoFileValue) && umbracoFileValue != null)
                {
                    var fileValue = umbracoFileValue.GetValue().ToString();
                    if (fileValue != null)
                    {
                        // The value might be a JSON string with src property or just a path
                        string? filePath = null;

                        if (fileValue.Contains("src"))
                        {
                            try
                            {
                                var json = JsonSerializer.Deserialize<JsonElement>(fileValue);
                                if (json.TryGetProperty("src", out var srcProperty))
                                {
                                    filePath = srcProperty.GetString();
                                }
                            }
                            catch { }
                        }

                        // If we couldn't extract from JSON, use the raw value
                        if (string.IsNullOrEmpty(filePath))
                        {
                            filePath = fileValue;
                        }

                        // Check if it's a media path
                        if (!string.IsNullOrEmpty(filePath) && filePath.StartsWith("/media/"))
                        {
                            // Map to physical path using Path.Combine for cross-platform compatibility
                            var physicalPath = Path.Combine(_env.WebRootPath, filePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));

                            // Check if file exists in the file system
                            if (_mediaFileManager.FileSystem.FileExists(physicalPath))
                            {
                                return _mediaFileManager.FileSystem.OpenFile(physicalPath);
                            }
                        }
                    }
                }

                // Alternative: Try to construct path from GUID
                // Umbraco typically stores files as GUID + extension in media folder
                var mediaGuid = media.Key.ToString();

                // Check for common extensions
                var extensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip" };
                foreach (var ext in extensions)
                {
                    var testPath = Path.Combine(_env.WebRootPath, "media", mediaGuid + ext);
                    if (_mediaFileManager.FileSystem.FileExists(testPath))
                    {
                        return _mediaFileManager.FileSystem.OpenFile(testPath);
                    }
                }

                return null;
            }
            catch
            {
                return null;
            }
        }

        public string GetMediaFileName(IMedia media)
        {
            try
            {
                // First, check if this media has a "umbracoFile" property
                if (media.Properties.TryGetValue("umbracoFile", out var umbracoFileValue) && umbracoFileValue != null)
                {
                    var fileValue = umbracoFileValue.GetValue()?.ToString();
                    if (!string.IsNullOrEmpty(fileValue))
                    {
                        string? filePath = null;

                        // Check if it's a JSON string with src property
                        if (fileValue.Contains("src"))
                        {
                            try
                            {
                                var json = JsonSerializer.Deserialize<JsonElement>(fileValue);
                                if (json.TryGetProperty("src", out var srcProperty))
                                {
                                    filePath = srcProperty.GetString();
                                }
                            }
                            catch { }
                        }

                        // If we couldn't extract from JSON, use the raw value
                        if (string.IsNullOrEmpty(filePath))
                        {
                            filePath = fileValue;
                        }

                        // Extract filename from path
                        if (!string.IsNullOrEmpty(filePath))
                        {
                            // Get the filename with extension
                            var fileName = Path.GetFileName(filePath);
                            if (!string.IsNullOrEmpty(fileName))
                            {
                                return fileName;
                            }
                        }
                    }
                }
                return media.Name;
            }
            catch
            {
                // Final fallback
                return media.Name + ".file";
            }
        }
    }
}