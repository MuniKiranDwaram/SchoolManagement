using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        public AppDbContext Context { get; set; }
        private readonly PasswordHasher<User> _passwordHasher = new();
        private readonly IConfiguration _configuration;

        public AuthenticationController(AppDbContext context, IConfiguration configuration)
        {
            Context = context;
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLogin user)
        {
            if (user is null || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var existingUser = Context.Users.FirstOrDefault(x => x.Email == user.Email);
            if (existingUser is null)
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            var result = _passwordHasher.VerifyHashedPassword(existingUser, existingUser.Password, user.Password);
            if (result != PasswordVerificationResult.Success)
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            var token = GenerateJwtToken(existingUser);
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddHours(1)
            });

            return Ok(new { message = "Login Success", token });
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public IActionResult Register([FromBody] UserLogin user)
        {
            if (user is null || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            if (user.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long." });
            }

            if (Context.Users.Any(x => x.Email == user.Email))
            {
                return Conflict(new { message = "User already exists" });
            }

            var newUser = new User
            {
                Email = user.Email,
                Id = (Context.Users.Count() + 1).ToString()
            };

            newUser.Password = _passwordHasher.HashPassword(newUser, user.Password);
            Context.Users.Add(newUser);
            Context.SaveChanges();

            return Ok(new { message = "User registration successful" });
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt", new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });

            return Ok(new { message = "Logout successful" });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "SchoolManagementApp";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "SchoolManagementAppUsers";

            var key = Encoding.UTF8.GetBytes(jwtKey);
            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
