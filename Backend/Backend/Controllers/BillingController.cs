using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    public class BillingController : Controller
    {
        private readonly AppDbContext _context;

        public BillingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("billing/getFeeDetails")]
        public IActionResult GetFeeDetails([FromQuery] string studentName)
        {
            if (string.IsNullOrWhiteSpace(studentName))
            {
                return BadRequest(new { message = "Student name is required." });
            }

            var student = _context.Students
                .FirstOrDefault(x => x.Name.Contains(studentName));

            if (student is null)
            {
                return NotFound(new { message = "Student fee details not found." });
            }

            var totalFee = ParseAmount(student.TotalFee);
            var installments = _context.StudentPayments
                .Where(x => x.StudentId == student.RollNo)
                .OrderBy(x => x.InstallmentNumber)
                .ToList();

            var paidAmount = installments.Sum(x => x.Amount);
            var pendingFeeAmount = Math.Max(totalFee - paidAmount, 0m);

            var summary = new
            {
                studentName = student.Name,
                totalFeeAmount = totalFee,
                paidAmount,
                pendingFeeAmount,
                balance = pendingFeeAmount,
                installments = installments.Select(x => new
                {
                    id = x.Id,
                    studentName = x.StudentName,
                    installmentNumber = x.InstallmentNumber,
                    amount = x.Amount,
                    paymentDate = x.PaymentDate,
                    paymentMode = x.PaymentMode,
                    referenceNumber = x.ReferenceNumber,
                    notes = x.Notes
                }),
                message = "Fee details retrieved successfully."
            };

            return Ok(summary);
        }

        [HttpGet]
        [Route("billing/paymentDetails")]
        public IActionResult GetPaymentDetails([FromQuery] string studentName)
        {
            if (string.IsNullOrWhiteSpace(studentName))
            {
                return BadRequest(new { message = "Student name is required." });
            }

            var student = _context.Students
                .FirstOrDefault(x => x.Name.Contains(studentName));

            if (student is null)
            {
                return NotFound(new { message = "Student payment details not found." });
            }

            var installments = _context.StudentPayments
                .Where(x => x.StudentId == student.RollNo)
                .OrderByDescending(x => x.PaymentDate)
                .ThenBy(x => x.InstallmentNumber)
                .ToList();

            return Ok(installments);
        }

        [HttpPost]
        [Route("billing/payFee")]
        public IActionResult PayFee([FromBody] FeePaymentRequest request)
        {
            if (request is null)
            {
                return BadRequest(new { message = "Payment details are required." });
            }

            if (string.IsNullOrWhiteSpace(request.StudentName))
            {
                return BadRequest(new { message = "Student name is required." });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new { message = "Payment amount must be greater than zero." });
            }

            var student = _context.Students
                .FirstOrDefault(x => x.Name.Contains(request.StudentName));

            if (student is null)
            {
                return NotFound(new { message = "Student not found." });
            }

            var totalFee = ParseAmount(student.TotalFee);
            var existingPayments = _context.StudentPayments
                .Where(x => x.StudentId == student.RollNo)
                .ToList();

            var paidAmount = existingPayments.Sum(x => x.Amount);
            var nextInstallment = existingPayments
                .Select(x => x.InstallmentNumber)
                .DefaultIfEmpty(0)
                .Max() + 1;

            var paymentRecord = new StudentPayment
            {
                StudentId = student.RollNo,
                StudentName = student.Name,
                InstallmentNumber = nextInstallment,
                Amount = request.Amount,
                PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
                PaymentMode = string.IsNullOrWhiteSpace(request.PaymentMode) ? "Cash" : request.PaymentMode,
                ReferenceNumber = request.ReferenceNumber ?? string.Empty,
                Notes = request.Notes ?? string.Empty
            };

            _context.StudentPayments.Add(paymentRecord);

            var updatedRemainingFee = Math.Max(totalFee - (paidAmount + request.Amount), 0m);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Payment recorded successfully.",
                studentName = student.Name,
                totalFeeAmount = totalFee,
                amount = request.Amount,
                remainingFee = updatedRemainingFee,
                balance = updatedRemainingFee,
                installmentNumber = nextInstallment,
                paymentDate = paymentRecord.PaymentDate,
                paymentMode = paymentRecord.PaymentMode,
                referenceNumber = paymentRecord.ReferenceNumber,
                notes = paymentRecord.Notes
            });
        }

        private static decimal ParseAmount(string? feeValue)
        {
            if (string.IsNullOrWhiteSpace(feeValue))
            {
                return 0m;
            }

            var normalized = feeValue.Replace("₹", "").Replace(",", "").Trim();
            return decimal.TryParse(normalized, out var amount) ? amount : 0m;
        }
    }

    public class FeePaymentRequest
    {
        public string StudentName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = "Cash";
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
        public DateTime? PaymentDate { get; set; }
    }
}
