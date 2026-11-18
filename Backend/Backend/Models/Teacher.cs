using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Teacher
    {
        public int TeacherID { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Designation { get; set; } = string.Empty;

        [Required]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public int Class { get; set; }

        [Required]
        public DateOnly DOB { get; set; }

        [Required]
        public DateOnly DOJ { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Salary { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;
    }
}
