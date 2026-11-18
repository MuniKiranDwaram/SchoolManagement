using Backend.Models;

namespace Backend.Services
{
    public class TenantContext
    {
        public int? CurrentTenantId { get; private set; }
        public string? CurrentSlug { get; private set; }
        public string? CurrentDatabaseName { get; private set; }

        public void SetTenant(SchoolTenant tenant)
        {
            CurrentTenantId = tenant.Id;
            CurrentSlug = tenant.Slug;
            CurrentDatabaseName = tenant.DatabaseName;
        }

        public void Clear()
        {
            CurrentTenantId = null;
            CurrentSlug = null;
            CurrentDatabaseName = null;
        }
    }
}
