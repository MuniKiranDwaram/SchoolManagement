using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Student
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int RollNo { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string? FatherName { get; set; }

        public string? MotherName { get; set; }

        [Required]
        public int Class { get; set; }

        public string? FatherOccupation { get; set; }

        public string? Caste { get; set; }

        [Required]
        public DateOnly DOB { get; set; }

        [Required]
        public DateOnly DOJ { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string ParentPhoneNumber { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        public string? TotalFee { get; set; }
    }
}
