using Npgsql;

namespace Backend.Services
{
    public class TenantDatabaseResolver
    {
        private readonly TenantContext _tenantContext;

        public TenantDatabaseResolver(TenantContext tenantContext)
        {
            _tenantContext = tenantContext;
        }

        public string ResolveConnectionString(IConfiguration configuration)
        {
            var baseConnection = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING");
            if (string.IsNullOrWhiteSpace(baseConnection))
            {
                var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
                var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
                var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "schoolmanagement";
                var username = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
                var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres";

                var builder = new NpgsqlConnectionStringBuilder
                {
                    Host = host,
                    Port = int.Parse(port),
                    Database = database,
                    Username = username,
                    Password = password
                };

                baseConnection = builder.ConnectionString;
            }

            if (string.IsNullOrWhiteSpace(baseConnection))
            {
                baseConnection = configuration.GetConnectionString("DefaultConnection")
                    ?? "Host=localhost;Port=5432;Database=schoolmanagement;Username=postgres;Password=postgres;";
            }

            var targetDatabase = _tenantContext.CurrentDatabaseName;
            if (string.IsNullOrWhiteSpace(targetDatabase))
            {
                return baseConnection;
            }

            var builderOverride = new NpgsqlConnectionStringBuilder(baseConnection)
            {
                Database = targetDatabase
            };

            return builderOverride.ConnectionString;
        }
    }
}
