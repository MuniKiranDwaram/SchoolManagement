using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Backend.Services
{
    public class TenantProvisioningService : ITenantProvisioningService
    {
        private readonly IConfiguration? _configuration;

        public TenantProvisioningService(IConfiguration? configuration = null)
        {
            _configuration = configuration;
        }

        public async Task<TenantProvisioningResult> ProvisionDatabaseAsync(string databaseName, string sourceDatabase = "schoolmanagement", CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(databaseName))
            {
                throw new ArgumentException("Database name is required for tenant provisioning.", nameof(databaseName));
            }

            var safeDatabaseName = databaseName.Trim();
            var safeSourceDatabase = string.IsNullOrWhiteSpace(sourceDatabase) ? "schoolmanagement" : sourceDatabase.Trim();
            var quotedDatabaseName = QuoteIdentifier(safeDatabaseName);
            var quotedSourceDatabase = QuoteIdentifier(safeSourceDatabase);
            var createSql = $"CREATE DATABASE {quotedDatabaseName} WITH TEMPLATE {quotedSourceDatabase};";

            var result = new TenantProvisioningResult
            {
                DatabaseName = safeDatabaseName,
                SqlStatement = createSql,
                Created = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            try
            {
                var masterConnectionString = ResolveMasterConnectionString();
                await using var connection = new NpgsqlConnection(masterConnectionString);
                await connection.OpenAsync(cancellationToken);

                var existsCommand = new NpgsqlCommand(
                    "SELECT 1 FROM pg_database WHERE datname = @databaseName",
                    connection);
                existsCommand.Parameters.AddWithValue("databaseName", safeDatabaseName);

                var databaseExists = await existsCommand.ExecuteScalarAsync(cancellationToken) is not null;
                if (databaseExists)
                {
                    result.Created = false;
                    result.SqlStatement = createSql;
                    return result;
                }

                await using var createCommand = new NpgsqlCommand(createSql, connection);
                await createCommand.ExecuteNonQueryAsync(cancellationToken);
                result.Created = true;
                return result;
            }
            catch (Exception)
            {
                result.Created = false;
                result.SqlStatement = createSql;
                return result;
            }
        }

        private string ResolveMasterConnectionString()
        {
            var configuredConnectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING");
            if (!string.IsNullOrWhiteSpace(configuredConnectionString))
            {
                return configuredConnectionString;
            }

            var appSettingsConnectionString = _configuration?.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrWhiteSpace(appSettingsConnectionString))
            {
                return appSettingsConnectionString;
            }

            var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
            return $"Host={dbHost};Port=5432;Database=postgres;Username=postgres;Password=postgres;";
        }

        private static string QuoteIdentifier(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                throw new ArgumentException("Database identifier cannot be empty.", nameof(identifier));
            }

            return "\"" + identifier.Replace("\"", "\"\"") + "\"";
        }
    }
}
