using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public interface ITenantProvisioningService
    {
        Task<TenantProvisioningResult> ProvisionDatabaseAsync(string databaseName, string sourceDatabase = "schoolmanagement", CancellationToken cancellationToken = default);
    }

    public class TenantProvisioningResult
    {
        public string DatabaseName { get; set; } = string.Empty;
        public string SqlStatement { get; set; } = string.Empty;
        public bool Created { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
