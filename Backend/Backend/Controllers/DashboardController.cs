using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var students = _context.Students.ToList();
            var totalTeachers = _context.Teachers.Count();
            var totalStudents = students.Count;
            var pendingFees = students.Count(student => ParseFeeAmount(student.TotalFee) > 0m);
            var pendingFeeAmount = students
                .Sum(student => ParseFeeAmount(student.TotalFee));

            var summary = new DashboardSummary
            {
                TotalTeachers = totalTeachers,
                TotalStudents = totalStudents,
                PendingFees = pendingFees,
                PendingFeeAmount = pendingFeeAmount,
                UpcomingEvents = 4,
                UpcomingItems = GetUpcomingItems(),
                Agenda = GetAgenda()
            };

            return Ok(summary);
        }

        private static List<DashboardItem> GetUpcomingItems()
        {
            return new List<DashboardItem>
            {
                new() { Name = "Independence Day", Type = "Holiday", Date = "2026-08-15" },
                new() { Name = "Teachers Day", Type = "Holiday", Date = "2026-09-05" },
                new() { Name = "Science Expo", Type = "Event", Date = "2026-11-12" },
                new() { Name = "Annual Day", Type = "Event", Date = "2026-12-20" }
            };
        }

        private static List<DashboardAgendaItem> GetAgenda()
        {
            return new List<DashboardAgendaItem>
            {
                new() { Time = "09:00", Title = "Assembly", Detail = "Daily school briefing" },
                new() { Time = "11:15", Title = "Class Review", Detail = "Teacher coordination meeting" },
                new() { Time = "14:00", Title = "Parent Call", Detail = "Student support follow-up" }
            };
        }

        private static decimal ParseFeeAmount(string? feeValue)
        {
            if (string.IsNullOrWhiteSpace(feeValue))
            {
                return 0m;
            }

            var normalized = feeValue.Replace("₹", "").Replace(",", "").Trim();
            return decimal.TryParse(normalized, out var amount) ? amount : 0m;
        }
    }

    public class DashboardSummary
    {
        public int TotalTeachers { get; set; }
        public int TotalStudents { get; set; }
        public int PendingFees { get; set; }
        public decimal PendingFeeAmount { get; set; }
        public int UpcomingEvents { get; set; }
        public List<DashboardItem> UpcomingItems { get; set; } = new();
        public List<DashboardAgendaItem> Agenda { get; set; } = new();
    }

    public class DashboardItem
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }

    public class DashboardAgendaItem
    {
        public string Time { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
    }
}
