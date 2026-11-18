using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Middlewares
{
    public class TenantResolutionMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var dbContext = context.RequestServices.GetRequiredService<AppDbContext>();
            var tenantContext = context.RequestServices.GetRequiredService<TenantContext>();
            var tenantSlug = context.Request.Headers["X-Tenant-Slug"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(tenantSlug))
            {
                context.Items["TenantRequestSlug"] = null;
                await _next(context);
                return;
            }

            var tenant = await dbContext.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Slug == tenantSlug && t.Status == "Active");

            if (tenant is null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await context.Response.WriteAsJsonAsync(new { message = "Tenant not found or inactive." });
                return;
            }

            context.Items["TenantRequestSlug"] = tenant.Slug;
            tenantContext.SetTenant(tenant);
            await _next(context);
        }
    }
}
