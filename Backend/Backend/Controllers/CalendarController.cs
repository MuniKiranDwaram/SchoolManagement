using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("calendar")]
    public class CalendarController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public CalendarController(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> GetEntries([FromQuery] string type)
        {
            var normalizedType = string.IsNullOrWhiteSpace(type) ? "" : type.Trim();

            var query = _context.CalendarEntries.AsQueryable();

            if (!string.IsNullOrWhiteSpace(normalizedType))
            {
                query = query.Where(x => x.Type.ToLower() == normalizedType.Trim().ToLower());
            }

            var entries = await query
                .OrderByDescending(x => x.Date)
                .ToListAsync();

            return Ok(entries.Select(x => new
            {
                id = x.Id,
                title = x.Title,
                date = x.Date.ToString("yyyy-MM-dd"),
                type = x.Type,
                googleFormLink = x.GoogleFormLink,
                createdAt = x.CreatedAt
            }));
        }

        [HttpPost]
        public async Task<IActionResult> CreateEntry([FromBody] CalendarEntryRequest request)
        {
            if (request is null)
            {
                return BadRequest(new { message = "Calendar entry is required." });
            }

            var type = string.IsNullOrWhiteSpace(request.Type) ? "Holiday" : request.Type.Trim();
            var title = string.IsNullOrWhiteSpace(request.Title) ? string.Empty : request.Title.Trim();

            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(new { message = "Title is required." });
            }

            if (request.Date == default)
            {
                return BadRequest(new { message = "Date is required." });
            }

            var entry = new CalendarEntry
            {
                Type = type,
                Title = title,
                Date = request.Date,
                GoogleFormLink = string.IsNullOrWhiteSpace(request.GoogleFormLink) ? null : request.GoogleFormLink.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.CalendarEntries.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = entry.Id,
                title = entry.Title,
                date = entry.Date.ToString("yyyy-MM-dd"),
                type = entry.Type,
                googleFormLink = entry.GoogleFormLink,
                createdAt = entry.CreatedAt,
                message = "Calendar entry saved successfully."
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateEntry(int id, [FromBody] CalendarEntryRequest request)
        {
            if (request is null)
            {
                return BadRequest(new { message = "Calendar entry is required." });
            }

            var entry = await _context.CalendarEntries.FindAsync(id);
            if (entry is null)
            {
                return NotFound(new { message = "Calendar entry not found." });
            }

            var title = string.IsNullOrWhiteSpace(request.Title) ? string.Empty : request.Title.Trim();
            if (string.IsNullOrWhiteSpace(title) || request.Date == default)
            {
                return BadRequest(new { message = "Title and date are required." });
            }

            entry.Type = string.IsNullOrWhiteSpace(request.Type) ? entry.Type : request.Type.Trim();
            entry.Title = title;
            entry.Date = request.Date;
            entry.GoogleFormLink = string.IsNullOrWhiteSpace(request.GoogleFormLink) ? null : request.GoogleFormLink.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = entry.Id,
                title = entry.Title,
                date = entry.Date.ToString("yyyy-MM-dd"),
                type = entry.Type,
                googleFormLink = entry.GoogleFormLink,
                message = "Calendar entry updated successfully."
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEntry(int id)
        {
            var entry = await _context.CalendarEntries.FindAsync(id);
            if (entry is null)
            {
                return NotFound(new { message = "Calendar entry not found." });
            }

            _context.CalendarEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Calendar entry deleted successfully." });
        }

        [HttpPost("send-whatsapp")]
        public async Task<IActionResult> SendWhatsAppNotification([FromBody] CalendarNotificationRequest request)
        {
            if (request is null)
            {
                return BadRequest(new { message = "Notification payload is required." });
            }

            var title = string.IsNullOrWhiteSpace(request.Title) ? string.Empty : request.Title.Trim();
            var type = string.IsNullOrWhiteSpace(request.Type) ? "Holiday" : request.Type.Trim();
            var date = request.Date == default ? DateOnly.FromDateTime(DateTime.UtcNow) : request.Date;

            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(new { message = "Event title is required." });
            }

            var teacherPhones = await _context.Teachers
                .Where(x => !string.IsNullOrWhiteSpace(x.Phone))
                .Select(x => x.Phone)
                .Distinct()
                .ToListAsync();

            var normalizedPhones = teacherPhones
                .Select(phone =>
                {
                    var digits = new string(phone.Where(char.IsDigit).ToArray());
                    if (string.IsNullOrWhiteSpace(digits) || digits.Length < 10)
                    {
                        return null;
                    }

                    if (digits.StartsWith("0"))
                    {
                        digits = digits.Substring(1);
                    }

                    if (digits.Length == 10)
                    {
                        digits = $"91{digits}";
                    }

                    return $"+{digits}";
                })
                .Where(phone => !string.IsNullOrWhiteSpace(phone))
                .Distinct()
                .ToList();

            if (!normalizedPhones.Any())
            {
                return NotFound(new { message = "No teacher phone numbers were found to send WhatsApp notifications." });
            }

            var providerUrl = _configuration["WhatsApp:ProviderUrl"];
            var message = $"Hello Team, this is a {type.ToLowerInvariant()} notice: {title} on {date:yyyy-MM-dd}. Please plan accordingly.";

            var isConfiguredProvider = !string.IsNullOrWhiteSpace(providerUrl)
                && (providerUrl.Contains("api.whatsapp.com", StringComparison.OrdinalIgnoreCase)
                    || providerUrl.Contains("whatsapp", StringComparison.OrdinalIgnoreCase));

            if (isConfiguredProvider)
            {
                var client = _httpClientFactory.CreateClient();
                var results = new List<object>();

                foreach (var phone in normalizedPhones)
                {
                    var payload = new
                    {
                        to = phone,
                        type = "text",
                        text = new { body = message }
                    };

                    var response = await client.PostAsJsonAsync(providerUrl, payload);
                    results.Add(new { phone, statusCode = (int)response.StatusCode, success = response.IsSuccessStatusCode });
                }

                return Ok(new
                {
                    success = true,
                    sentTo = normalizedPhones.Count,
                    message,
                    provider = "configured-provider",
                    providerUrl,
                    results
                });
            }

            var waLinks = normalizedPhones
                .Select(phone => $"https://wa.me/{phone}?text={Uri.EscapeDataString(message)}")
                .ToList();

            return Ok(new
            {
                success = true,
                sentTo = normalizedPhones.Count,
                message,
                provider = "wa.me-link",
                providerUrl = "https://wa.me",
                links = waLinks
            });
        }
    }

    public class CalendarEntryRequest
    {
        public string Type { get; set; } = "Holiday";
        public string Title { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string? GoogleFormLink { get; set; }
    }

    public class CalendarNotificationRequest
    {
        public string Type { get; set; } = "Holiday";
        public string Title { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
    }
}
