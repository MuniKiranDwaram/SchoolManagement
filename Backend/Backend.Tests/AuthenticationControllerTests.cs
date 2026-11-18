using Backend.Controllers;
using Backend.Data;
using Backend.DTO;
using Backend.Middlewares;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Backend.Tests;

public class AuthenticationControllerTests
{
    private sealed class FakeTenantProvisioningService : ITenantProvisioningService
    {
        private readonly bool _created;

        public FakeTenantProvisioningService(bool created)
        {
            _created = created;
        }

        public Task<TenantProvisioningResult> ProvisionDatabaseAsync(string databaseName, string sourceDatabase = "schoolmanagement", CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new TenantProvisioningResult
            {
                DatabaseName = databaseName,
                SqlStatement = $"CREATE DATABASE \"{databaseName}\" WITH TEMPLATE \"{sourceDatabase}\";",
                Created = _created,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
    }

    [Fact]
    public void Register_Then_Login_ShouldSucceedWithJwtCookie()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "ThisIsADevelopmentJwtKeyForSchoolManagementApp123456",
                ["Jwt:Issuer"] = "SchoolManagementApp",
                ["Jwt:Audience"] = "SchoolManagementAppUsers"
            })
            .Build();

        var controller = new AuthenticationController(context, config)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var registerResult = controller.Register(new UserLogin
        {
            Email = "admin@school.com",
            Password = "Password123"
        });

        var loginResult = controller.Login(new UserLogin
        {
            Email = "admin@school.com",
            Password = "Password123"
        });

        Assert.IsType<OkObjectResult>(registerResult);
        var okLogin = Assert.IsType<OkObjectResult>(loginResult);
        Assert.NotNull(okLogin.Value);
        Assert.Contains("jwt", controller.Response.Headers.SetCookie.ToString());
    }

    [Fact]
    public void TeacherController_ShouldRequireAdminAuthorization()
    {
        var attribute = typeof(TeacherController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .FirstOrDefault();

        Assert.NotNull(attribute);
        Assert.Contains("Admin", ((AuthorizeAttribute)attribute!).Roles ?? string.Empty);
    }

    [Fact]
    public void SchoolTenantController_ShouldRequireAdminAuthorization()
    {
        var attribute = typeof(SchoolTenantController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .FirstOrDefault();

        Assert.NotNull(attribute);
        Assert.Contains("Admin", ((AuthorizeAttribute)attribute!).Roles ?? string.Empty);
    }

    [Fact]
    public void AddStudent_WhenValid_ShouldPersistStudentRecord()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var controller = new StudentController(context);

        var result = controller.AddStudent(new Student
        {
            Name = "Alice Johnson",
            Description = "New student",
            FatherName = "Peter Johnson",
            MotherName = "Jane Johnson",
            Class = 6,
            FatherOccupation = "Engineer",
            Caste = "General",
            DOB = new DateOnly(2014, 5, 8),
            DOJ = new DateOnly(2025, 6, 1),
            Email = "alice@example.com",
            ParentPhoneNumber = "9876543210",
            Address = "Main Street",
            TotalFee = "25000"
        }, "Add");

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, context.Students.Count());
    }

    [Fact]
    public void AddStudent_WhenNewAdmissionIn2026_ShouldGenerateYearBasedRollNumber()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var controller = new StudentController(context);

        var result = controller.AddStudent(new Student
        {
            Name = "Ava Green",
            Description = "New student",
            FatherName = "John Green",
            MotherName = "Lucy Green",
            Class = 8,
            FatherOccupation = "Businessman",
            Caste = "General",
            DOB = new DateOnly(2014, 5, 8),
            DOJ = new DateOnly(2026, 6, 1),
            Email = "ava@example.com",
            ParentPhoneNumber = "9876543212",
            Address = "Hill Street",
            TotalFee = "20000"
        }, "Add");

        var okResult = Assert.IsType<OkObjectResult>(result);
        var student = Assert.Single(context.Students);
        Assert.Equal(26001, student.RollNo);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void AddTeacher_WhenRequiredValuesMissing_ShouldReturnBadRequest()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var controller = new TeacherController(context);

        var result = controller.AddTeacher(new Teacher
        {
            Name = "",
            Designation = "",
            Subject = "",
            Email = "",
            Phone = "",
            Salary = "",
            Address = ""
        }, "Add");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void BillingController_WhenStudentExists_ShouldReturnFeeSummary()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        context.Students.Add(new Student
        {
            RollNo = 101,
            Name = "Alice Johnson",
            Description = "Fee status",
            FatherName = "Peter Johnson",
            MotherName = "Jane Johnson",
            Class = 6,
            FatherOccupation = "Engineer",
            Caste = "General",
            DOB = new DateOnly(2014, 5, 8),
            DOJ = new DateOnly(2025, 6, 1),
            Email = "alice@example.com",
            ParentPhoneNumber = "9876543210",
            Address = "Main Street",
            TotalFee = "25000"
        });
        context.SaveChanges();

        var controller = new BillingController(context);
        var result = controller.GetFeeDetails("Alice Johnson");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void BillingController_WhenStudentHasInstallments_ShouldReturnInstallmentHistory()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var student = new Student
        {
            RollNo = 101,
            Name = "Alice Johnson",
            Description = "Fee status",
            FatherName = "Peter Johnson",
            MotherName = "Jane Johnson",
            Class = 6,
            FatherOccupation = "Engineer",
            Caste = "General",
            DOB = new DateOnly(2014, 5, 8),
            DOJ = new DateOnly(2025, 6, 1),
            Email = "alice@example.com",
            ParentPhoneNumber = "9876543210",
            Address = "Main Street",
            TotalFee = "25000"
        };

        context.Students.Add(student);
        context.StudentPayments.AddRange(
            new StudentPayment
            {
                StudentId = student.RollNo,
                StudentName = student.Name,
                InstallmentNumber = 1,
                Amount = 10000m,
                PaymentDate = new DateTime(2025, 7, 5),
                PaymentMode = "Cash",
                ReferenceNumber = "INV-1001",
                Notes = "Tuition fee"
            },
            new StudentPayment
            {
                StudentId = student.RollNo,
                StudentName = student.Name,
                InstallmentNumber = 2,
                Amount = 5000m,
                PaymentDate = new DateTime(2025, 8, 5),
                PaymentMode = "UPI",
                ReferenceNumber = "UPI-2002",
                Notes = "Transport fee"
            }
        );
        context.SaveChanges();

        var controller = new BillingController(context);
        var result = controller.GetPaymentDetails("Alice Johnson");

        var okResult = Assert.IsType<OkObjectResult>(result);
        var installments = Assert.IsAssignableFrom<IEnumerable<StudentPayment>>(okResult.Value);
        Assert.Equal(2, installments.Count());
    }

    [Fact]
    public void DashboardController_WhenRecordsExist_ShouldReturnSummary()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        context.Teachers.AddRange(
            new Teacher { TeacherID = 1, Name = "Teacher One", Designation = "Math HOD", Subject = "Mathematics", Class = 8, DOB = new DateOnly(1985, 2, 10), DOJ = new DateOnly(2023, 6, 1), Email = "one@school.com", Phone = "9876543210", Salary = "50000", Address = "Main Street" },
            new Teacher { TeacherID = 2, Name = "Teacher Two", Designation = "Science Teacher", Subject = "Science", Class = 9, DOB = new DateOnly(1987, 3, 15), DOJ = new DateOnly(2024, 1, 10), Email = "two@school.com", Phone = "9876543211", Salary = "52000", Address = "Second Street" }
        );

        context.Students.AddRange(
            new Student { RollNo = 101, Name = "Alice Johnson", Description = "Student", FatherName = "Peter Johnson", MotherName = "Jane Johnson", Class = 8, FatherOccupation = "Engineer", Caste = "General", DOB = new DateOnly(2014, 5, 8), DOJ = new DateOnly(2025, 6, 1), Email = "alice@example.com", ParentPhoneNumber = "9876543210", Address = "Main Street", TotalFee = "15000" },
            new Student { RollNo = 102, Name = "Bob Smith", Description = "Student", FatherName = "Greg Smith", MotherName = "Lisa Smith", Class = 9, FatherOccupation = "Doctor", Caste = "General", DOB = new DateOnly(2013, 11, 28), DOJ = new DateOnly(2025, 6, 1), Email = "bob@example.com", ParentPhoneNumber = "9876543211", Address = "Market Road", TotalFee = "0" }
        );
        context.SaveChanges();

        var controller = new DashboardController(context);
        var result = controller.GetSummary();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var model = Assert.IsAssignableFrom<DashboardSummary>(okResult.Value);
        Assert.Equal(2, model.TotalTeachers);
        Assert.Equal(2, model.TotalStudents);
        Assert.Equal(1, model.PendingFees);
        Assert.NotEmpty(model.UpcomingItems);
    }

    [Fact]
    public void HealthController_WhenRequested_ShouldReturnHealthyStatus()
    {
        var controller = new HealthController();

        var result = controller.Get();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var payload = okResult.Value;
        Assert.NotNull(payload);
    }

    [Fact]
    public async Task TenantController_WhenRegisteringSchool_ShouldPersistTenant()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var controller = new SchoolTenantController(context);

        var result = await controller.Register(new SchoolTenant
        {
            Name = "Sunrise Academy",
            Slug = "sunrise-academy",
            DatabaseName = "school_sunrise",
            Status = "Active"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        Assert.Equal(1, context.Tenants.Count());
    }

    [Fact]
    public async Task SchoolTenantController_WhenProvisioningFails_ShouldMarkTenantAsProvisionFailed()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        var provisioningService = new FakeTenantProvisioningService(false);
        var controller = new SchoolTenantController(context, provisioningService);

        var result = await controller.Register(new SchoolTenant
        {
            Name = "Broken Academy",
            Slug = "broken-academy",
            DatabaseName = "school_broken"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var tenant = context.Tenants.Single();
        Assert.Equal("ProvisionFailed", tenant.Status);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task SchoolTenantController_WhenRetryingProvisioningForFailedTenant_ShouldReturnPendingStatus()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        var tenant = new SchoolTenant
        {
            Name = "Retry Academy",
            Slug = "retry-academy",
            DatabaseName = "school_retry",
            Status = "ProvisionFailed"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var controller = new SchoolTenantController(context, new FakeTenantProvisioningService(true));
        var result = await controller.RetryProvisioning(tenant.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var updated = context.Tenants.Single();
        Assert.Equal("Pending", updated.Status);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task SchoolTenantController_WhenActivateTenant_ShouldSetStatusToActive()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        var tenant = new SchoolTenant
        {
            Name = "Sunrise Academy",
            Slug = "sunrise-academy",
            DatabaseName = "school_sunrise",
            Status = "Pending"
        };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var controller = new SchoolTenantController(context);
        var result = await controller.ActivateTenant(tenant.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var updated = context.Tenants.Single();
        Assert.Equal("Active", updated.Status);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task SchoolTenantController_WhenListingActiveTenants_ShouldExcludeInactiveOnes()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        context.Tenants.AddRange(
            new SchoolTenant { Name = "Active One", Slug = "active-one", DatabaseName = "school_active_one", Status = "Active" },
            new SchoolTenant { Name = "Pending One", Slug = "pending-one", DatabaseName = "school_pending_one", Status = "Pending" },
            new SchoolTenant { Name = "Suspended One", Slug = "suspended-one", DatabaseName = "school_suspended_one", Status = "Suspended" }
        );
        await context.SaveChangesAsync();

        var controller = new SchoolTenantController(context);
        var result = await controller.GetActiveTenants();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var tenants = Assert.IsAssignableFrom<IEnumerable<SchoolTenant>>(okResult.Value);
        var activeTenant = Assert.Single(tenants);
        Assert.Equal("Active", activeTenant.Status);
    }

    [Fact]
    public async Task TenantResolutionMiddleware_WhenTenantHeaderMatchesActiveTenant_SetsTenantContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        context.Tenants.Add(new SchoolTenant
        {
            Name = "Sunrise Academy",
            Slug = "sunrise-academy",
            DatabaseName = "school_sunrise",
            Status = "Active"
        });
        await context.SaveChangesAsync();

        var service = new TenantContext();
        var middleware = new TenantResolutionMiddleware(_ => Task.CompletedTask);
        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(context)
            .AddSingleton(service)
            .BuildServiceProvider();
        httpContext.Request.Headers["X-Tenant-Slug"] = "sunrise-academy";

        await middleware.Invoke(httpContext);

        Assert.Equal("sunrise-academy", service.CurrentSlug);
        Assert.Equal("school_sunrise", service.CurrentDatabaseName);
    }

    [Fact]
    public async Task TenantResolutionMiddleware_WhenTenantHeaderDoesNotMatchActiveTenant_ReturnsNotFound()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        var service = new TenantContext();
        var middleware = new TenantResolutionMiddleware(_ => Task.CompletedTask);
        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(context)
            .AddSingleton(service)
            .BuildServiceProvider();
        httpContext.Request.Headers["X-Tenant-Slug"] = "missing-school";

        await middleware.Invoke(httpContext);

        Assert.Equal(StatusCodes.Status404NotFound, httpContext.Response.StatusCode);
    }

    [Fact]
    public void TenantDatabaseResolver_WhenTenantContextHasDatabaseName_UsesTenantDatabase()
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(new SchoolTenant
        {
            Id = 7,
            Name = "Sunrise Academy",
            Slug = "sunrise-academy",
            DatabaseName = "school_sunrise"
        });

        var resolver = new TenantDatabaseResolver(tenantContext);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5432;Database=schoolmanagement;Username=postgres;Password=postgres;"
            })
            .Build();

        var result = resolver.ResolveConnectionString(config);

        Assert.Contains("Database=school_sunrise", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TenantDatabaseResolver_WhenEnvironmentOverridesArePresent_UsesEnvironmentValues()
    {
        var originalHost = Environment.GetEnvironmentVariable("DB_HOST");
        var originalPort = Environment.GetEnvironmentVariable("DB_PORT");
        var originalName = Environment.GetEnvironmentVariable("DB_NAME");
        var originalUser = Environment.GetEnvironmentVariable("DB_USER");
        var originalPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

        try
        {
            Environment.SetEnvironmentVariable("DB_HOST", "db.internal");
            Environment.SetEnvironmentVariable("DB_PORT", "5433");
            Environment.SetEnvironmentVariable("DB_NAME", "school_master");
            Environment.SetEnvironmentVariable("DB_USER", "db_user");
            Environment.SetEnvironmentVariable("DB_PASSWORD", "db_password");

            var tenantContext = new TenantContext();
            var resolver = new TenantDatabaseResolver(tenantContext);
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5432;Database=schoolmanagement;Username=postgres;Password=postgres;"
                })
                .Build();

            var result = resolver.ResolveConnectionString(config);

            Assert.Contains("Host=db.internal", result, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Port=5433", result, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Database=school_master", result, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Username=db_user", result, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Password=db_password", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            Environment.SetEnvironmentVariable("DB_HOST", originalHost);
            Environment.SetEnvironmentVariable("DB_PORT", originalPort);
            Environment.SetEnvironmentVariable("DB_NAME", originalName);
            Environment.SetEnvironmentVariable("DB_USER", originalUser);
            Environment.SetEnvironmentVariable("DB_PASSWORD", originalPassword);
        }
    }

    [Fact]
    public async Task TenantProvisioningService_WhenTriggered_ShouldReturnDatabaseProvisioningMetadata()
    {
        var service = new TenantProvisioningService();

        var result = await service.ProvisionDatabaseAsync("school_alpha", "schoolmanagement");

        Assert.NotNull(result);
        Assert.Equal("school_alpha", result.DatabaseName);
        Assert.Contains("CREATE DATABASE", result.SqlStatement, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TenantProvisioningService_WhenDatabaseNameContainsQuotes_ShouldEscapeIdentifier()
    {
        var service = new TenantProvisioningService();

        var result = await service.ProvisionDatabaseAsync("school\"alpha");

        Assert.Equal("school\"alpha", result.DatabaseName);
        Assert.Contains("CREATE DATABASE \"school\"\"alpha\" WITH TEMPLATE \"schoolmanagement\"", result.SqlStatement, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TenantAuthorizationPolicy_WhenRequestTenantDoesNotMatchUserTenant_RejectsAccess()
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(new SchoolTenant
        {
            Id = 5,
            Name = "Alpha School",
            Slug = "alpha-school",
            DatabaseName = "school_alpha",
            Status = "Active"
        });

        var policy = new TenantAuthorizationPolicy(tenantContext);
        var result = await policy.AuthorizeAsync("beta-school");

        Assert.False(result);
    }
}
