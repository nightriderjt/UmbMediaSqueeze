using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using UmbMediaSqueeze.Models;
using UmbMediaSqueeze.Services;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Authorization;

namespace UmbMediaSqueeze.Controllers
{
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "UmbMediaSqueeze")]
    [VersionedApiBackOfficeRoute("UmbMediaSqueeze")]

    public partial class UmbMediaSqueezeApiController : ControllerBase
    {
        private readonly IMediaService _mediaService;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IWebHostEnvironment _env;
        private readonly IJobManagementService _jobManagementService;
        private readonly IMediaCompressionService _mediaCompressionService;
        private readonly IMediaTraversalService _mediaTraversalService;

        public UmbMediaSqueezeApiController(
            IMediaService mediaService,
            MediaFileManager mediaFileManager,
            IWebHostEnvironment env,
            IJobManagementService jobManagementService,
            IMediaCompressionService mediaCompressionService,
            IMediaTraversalService mediaTraversalService)
        {
            _mediaService = mediaService;
            _mediaFileManager = mediaFileManager;
            _env = env;
            _jobManagementService = jobManagementService;
            _mediaCompressionService = mediaCompressionService;
            _mediaTraversalService = mediaTraversalService;
        }
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        [Authorize(Policy = AuthorizationPolicies.TreeAccessMediaOrMediaTypes)]
        [Authorize(Policy = AuthorizationPolicies.SectionAccessMedia)]
        [HttpPost("squeeze")]
        public async Task<IActionResult> Squeeze([FromBody] SqueezePostModel squeezePostModel)
        {
            if (squeezePostModel.MediaGuids == null || squeezePostModel.MediaGuids.Length == 0)
            {
                return BadRequest(new { error = "No media GUIDs provided" });
            }

            // Create job with all media GUIDs
            var job = _jobManagementService.CreateJob(squeezePostModel.MediaGuids);

            // Start compression in background using service
            _ = Task.Run(() => _mediaCompressionService.CompressMediaAsync(job));

            return Ok(new { jobId = job.Id, status = "queued" });
        }
        [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
        [Authorize(Policy = AuthorizationPolicies.TreeAccessMediaOrMediaTypes)]
        [Authorize(Policy = AuthorizationPolicies.SectionAccessMedia)]
        [HttpGet("{jobId}/status")]
        public async Task<IActionResult> GetStatus(Guid jobId)
        {
            var job = _jobManagementService.GetJob(jobId);
            if (job == null)
            {
                return NotFound(new { error = "Job not found" });
            }

            return Ok(new
            {
                jobId = job.Id,
                status = job.Status.ToString().ToLower(),
                progress = job.Progress,
                message = job.Message,
                downloadUrl = job.Status == CompressionStatus.Completed ? $"/umbraco/management/api/v1/umbmediasqueeze/{jobId}/download" : null,
                error = job.Error,
                currentFile = job.CurrentFile
            });
        }

        [HttpGet("{jobId}/download")]
        public async Task<IActionResult> Download(Guid jobId)
        {
            var job = _jobManagementService.GetJob(jobId);
            if (job == null || job.Status != CompressionStatus.Completed)
            {
                return NotFound(new { error = "File not available" });
            }

            if (string.IsNullOrEmpty(job.FilePath) || !System.IO.File.Exists(job.FilePath))
            {
                return NotFound(new { error = "File not found" });
            }

            var fileName = $"{job.MediaGuid:N}.zip";
            var fileBytes = System.IO.File.ReadAllBytes(job.FilePath);

            // Clean up file and remove job from service
            try { System.IO.File.Delete(job.FilePath); } catch { }
            _jobManagementService.RemoveJob(jobId);

            return File(fileBytes, "application/zip", fileName);
        }
    }
}
