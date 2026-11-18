using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class CalendarEntry
    {
        public int Id { get; set; }

        [Required]
        public string Type { get; set; } = "Holiday";

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public DateOnly Date { get; set; }

        public string? GoogleFormLink { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
