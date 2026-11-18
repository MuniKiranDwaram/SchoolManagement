using Backend.Controllers;
using Backend.Data;
using Backend.Middlewares;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SchoolManagementApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SchoolManagementAppUsers";
var connectionString = ResolveConnectionString(builder.Configuration);
var allowedOrigins = ResolveAllowedOrigins(builder.Configuration);

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddScoped<TenantDatabaseResolver>();
builder.Services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
builder.Services.AddScoped<TenantAuthorizationPolicy>();
builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
{
    var resolver = serviceProvider.GetRequiredService<TenantDatabaseResolver>();
    var tenantConnectionString = resolver.ResolveConnectionString(builder.Configuration);
    options.UseNpgsql(tenantConnectionString);
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["jwt"];
            if (!string.IsNullOrWhiteSpace(token))
            {
                context.Token = token;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddScoped<TenantContext>();
builder.Services.AddAuthorization();
builder.Services.AddHttpClient();
builder.Services.AddHealthChecks();

builder.Services.AddControllers();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        ApplyMigrations(app, db);
    }
    catch (NpgsqlException ex)
    {
        app.Logger.LogError(ex,
            "PostgreSQL is not available. Start the database service or set POSTGRES_CONNECTION_STRING, then restart the backend. Connection string: {ConnectionString}",
            connectionString);
        throw;
    }
}

app.UseCors("AllowReactApp");
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    var tenantSlug = context.Request.Headers["X-Tenant-Slug"].FirstOrDefault();
    if (!string.IsNullOrWhiteSpace(tenantSlug))
    {
        var policy = context.RequestServices.GetRequiredService<TenantAuthorizationPolicy>();
        var isAuthorized = await policy.AuthorizeAsync(tenantSlug);
        if (!isAuthorized)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { message = "Cross-tenant access is not allowed." });
            return;
        }
    }

    await next();
});
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();

static string ResolveConnectionString(IConfiguration configuration)
{
    var envConnectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING");
    if (!string.IsNullOrWhiteSpace(envConnectionString))
    {
        return envConnectionString;
    }

    var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(configuredConnectionString))
    {
        return configuredConnectionString;
    }

    var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
    var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "schoolmanagement";
    var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
    var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres";

    return $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};";
}

static string[] ResolveAllowedOrigins(IConfiguration configuration)
{
    var configuredOrigins = Environment.GetEnvironmentVariable("FRONTEND_ALLOWED_ORIGIN")
        ?? configuration["Frontend:AllowedOrigin"]
        ?? "http://localhost:5173";

    return configuredOrigins
        .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Where(origin => !string.IsNullOrWhiteSpace(origin))
        .Distinct()
        .ToArray();
}

static void ApplyMigrations(WebApplication app, AppDbContext db)
{
    const int maximumRetries = 10;
    for (var attempt = 1; attempt <= maximumRetries; attempt++)
    {
        try
        {
            db.Database.Migrate();
            return;
        }
        catch (NpgsqlException ex) when (attempt < maximumRetries)
        {
            app.Logger.LogWarning(ex,
                "Database is not ready yet. Retrying migration ({Attempt}/{MaximumRetries}) in 2 seconds...",
                attempt,
                maximumRetries);
            Thread.Sleep(2000);
        }
    }
}
