using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class StudentPayment
    {
        [Key]
        public int Id { get; set; }

        public int StudentId { get; set; }

        public string StudentName { get; set; } = string.Empty;

        public int InstallmentNumber { get; set; }

        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public string PaymentMode { get; set; } = "Cash";

        public string ReferenceNumber { get; set; } = string.Empty;

        public string Notes { get; set; } = string.Empty;
    }
}
