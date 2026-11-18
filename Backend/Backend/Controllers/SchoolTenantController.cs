using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    public class SchoolTenantController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantProvisioningService _provisioningService;

        public SchoolTenantController(AppDbContext context, ITenantProvisioningService? provisioningService = null)
        {
            _context = context;
            _provisioningService = provisioningService ?? new TenantProvisioningService();
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var tenants = _context.Tenants
                .OrderByDescending(t => t.CreatedAt)
                .ToList();

            return Ok(tenants);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTenants()
        {
            var tenants = await _context.Tenants
                .Where(t => t.Status == "Active")
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingTenants()
        {
            var tenants = await _context.Tenants
                .Where(t => t.Status == "Pending" || t.Status == "ProvisionFailed")
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var tenant = _context.Tenants.FirstOrDefault(t => t.Id == id);
            if (tenant is null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            return Ok(tenant);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] SchoolTenant tenant)
        {
            if (tenant is null)
            {
                return BadRequest(new { message = "Tenant payload is required." });
            }

            tenant.Name = tenant.Name.Trim();
            tenant.Slug = NormalizeSlug(tenant.Slug);
            tenant.DatabaseName = NormalizeDatabaseName(tenant.DatabaseName);

            if (string.IsNullOrWhiteSpace(tenant.Name) ||
                string.IsNullOrWhiteSpace(tenant.Slug) ||
                string.IsNullOrWhiteSpace(tenant.DatabaseName))
            {
                return BadRequest(new { message = "Tenant name, slug, and database name are required." });
            }

            if (_context.Tenants.Any(t => t.Slug == tenant.Slug || t.DatabaseName == tenant.DatabaseName))
            {
                return Conflict(new { message = "A tenant with the same slug or database name already exists." });
            }

            try
            {
                var provisioningResult = await _provisioningService.ProvisionDatabaseAsync(tenant.DatabaseName, "schoolmanagement");
                tenant.Status = provisioningResult.Created ? "Pending" : "ProvisionFailed";
                tenant.CreatedAt = DateTime.UtcNow;
                tenant.UpdatedAt = DateTime.UtcNow;

                _context.Tenants.Add(tenant);
                _context.SaveChanges();

                return Ok(new
                {
                    message = provisioningResult.Created ? "Tenant registered successfully." : "Tenant registration created a failed provisioning record.",
                    tenant,
                    provisioning = provisioningResult
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Tenant provisioning failed.", error = ex.Message });
            }
        }

        [HttpPatch("{id:int}/retry-provision")]
        public async Task<IActionResult> RetryProvisioning(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant is null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            if (string.IsNullOrWhiteSpace(tenant.DatabaseName))
            {
                return BadRequest(new { message = "Tenant database name is required before provisioning can be retried." });
            }

            try
            {
                var provisioningResult = await _provisioningService.ProvisionDatabaseAsync(tenant.DatabaseName, "schoolmanagement");
                tenant.Status = provisioningResult.Created ? "Pending" : "ProvisionFailed";
                tenant.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = provisioningResult.Created ? "Tenant provisioning retried successfully." : "Tenant provisioning is still failing.",
                    tenant,
                    provisioning = provisioningResult
                });
            }
            catch (Exception ex)
            {
                tenant.Status = "ProvisionFailed";
                tenant.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return StatusCode(500, new { message = "Tenant provisioning retry failed.", error = ex.Message });
            }
        }

        [HttpPatch("{id:int}/activate")]
        public async Task<IActionResult> ActivateTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant is null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            tenant.Status = "Active";
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tenant activated successfully.", tenant });
        }

        [HttpPatch("{id:int}/suspend")]
        public async Task<IActionResult> SuspendTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant is null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            tenant.Status = "Suspended";
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tenant suspended successfully.", tenant });
        }

        private static string NormalizeSlug(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return value.Trim().ToLowerInvariant()
                .Replace(" ", "-")
                .Replace("_", "-")
                .Replace("--", "-")
                .Trim('-');
        }

        private static string NormalizeDatabaseName(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var normalized = value.Trim().ToLowerInvariant();
            return normalized.Replace(" ", "_").Replace("-", "_").Replace("..", ".");
        }
    }
}
