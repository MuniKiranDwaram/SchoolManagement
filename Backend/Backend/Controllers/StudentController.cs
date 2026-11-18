using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    public class StudentController : Controller
    {
        private readonly AppDbContext _context;

        public StudentController(AppDbContext context)
        {
            _context = context;
        }

        private static string NormalizeText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
        }

        private static string NormalizeName(string? value)
        {
            return NormalizeText(value).ToUpperInvariant();
        }

        private static bool IsRequiredStudentDataPresent(Student student)
        {
            return student is not null
                && !string.IsNullOrWhiteSpace(student.Name)
                && student.Class > 0
                && !string.IsNullOrWhiteSpace(student.Email)
                && !string.IsNullOrWhiteSpace(student.Address)
                && !string.IsNullOrWhiteSpace(student.ParentPhoneNumber)
                && student.DOB != default
                && student.DOJ != default;
        }

        private int GenerateRollNo(Student student)
        {
            var yearPrefix = student.DOJ.Year % 100;
            var sequenceNumber = _context.Students
                .Count(x => x.DOJ.Year == student.DOJ.Year && x.Class == student.Class) + 1;

            return int.Parse($"{yearPrefix}{sequenceNumber:D3}");
        }

        [HttpPost]
        [Route("student/addStudent")]
        public IActionResult AddStudent([FromBody] Student student, [FromQuery] string addType = "Add")
        {
            try
            {
                if (student is null)
                {
                    return BadRequest(new { message = "Student details are required." });
                }

                student.Name = NormalizeName(student.Name);
                student.Email = NormalizeText(student.Email).ToLowerInvariant();
                student.Address = NormalizeText(student.Address);
                student.ParentPhoneNumber = NormalizeText(student.ParentPhoneNumber);
                student.FatherName = NormalizeName(student.FatherName);
                student.MotherName = NormalizeName(student.MotherName);
                student.Description = NormalizeText(student.Description ?? string.Empty);
                student.FatherOccupation = NormalizeText(student.FatherOccupation);
                student.Caste = NormalizeText(student.Caste);
                student.TotalFee = NormalizeText(student.TotalFee);

                if (!IsRequiredStudentDataPresent(student))
                {
                    return BadRequest(new { message = "Name, class, email, address, parent phone number, DOB and DOJ are required." });
                }

                if (string.IsNullOrWhiteSpace(addType))
                {
                    return BadRequest(new { message = "Operation type is required." });
                }

                if (addType == "Add")
                {
                    var normalizedEmail = student.Email.Trim();
                    if (_context.Students.Any(x => x.Email.ToLower() == normalizedEmail))
                    {
                        return Conflict(new { message = "Student already exists" });
                    }

                    student.RollNo = GenerateRollNo(student);
                    _context.Students.Add(student);
                    _context.SaveChanges();
                    return Ok(new { message = "Student details saved successfully" });
                }

                if (addType == "Update")
                {
                    var existingStudent = _context.Students.FirstOrDefault(x => x.Email.ToLower() == student.Email.ToLower());
                    if (existingStudent is null)
                    {
                        return NotFound(new { message = "Student details not found" });
                    }

                    existingStudent.Name = student.Name;
                    existingStudent.Description = string.IsNullOrWhiteSpace(student.Description) ? string.Empty : student.Description;
                    existingStudent.FatherName = string.IsNullOrWhiteSpace(student.FatherName) ? existingStudent.FatherName : student.FatherName;
                    existingStudent.MotherName = string.IsNullOrWhiteSpace(student.MotherName) ? existingStudent.MotherName : student.MotherName;
                    existingStudent.Class = student.Class;
                    existingStudent.FatherOccupation = string.IsNullOrWhiteSpace(student.FatherOccupation) ? existingStudent.FatherOccupation : student.FatherOccupation;
                    existingStudent.Caste = string.IsNullOrWhiteSpace(student.Caste) ? existingStudent.Caste : student.Caste;
                    existingStudent.DOB = student.DOB;
                    existingStudent.DOJ = student.DOJ;
                    existingStudent.Email = student.Email;
                    existingStudent.ParentPhoneNumber = student.ParentPhoneNumber;
                    existingStudent.Address = student.Address;
                    existingStudent.TotalFee = string.IsNullOrWhiteSpace(student.TotalFee) ? existingStudent.TotalFee : student.TotalFee;

                    _context.SaveChanges();
                    return Ok(new { message = "Student details updated successfully" });
                }

                return BadRequest(new { message = "Invalid operation type." });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Unable to save student details. Please check the required fields and database schema." + ex.InnerException?.Message });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while processing student details." });
            }
        }

        [HttpGet]
        [Route("student/searchStudent")]
        public IActionResult SearchStudent([FromQuery] string studentName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(studentName))
                {
                    return Ok(new List<Student>());
                }

                var searchName = studentName.Trim();
                var students = _context.Students
                    .Where(x => x.Name != null && x.Name.ToLower().Contains(searchName.ToLower()))
                    .OrderBy(x => x.Name)
                    .ToList();

                if (!students.Any())
                {
                    return Ok(new List<Student>());
                }

                return Ok(students);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while searching student details." });
            }
        }

        [HttpDelete]
        [Route("student/deleteStudent/{rollNo:int}")]
        public IActionResult DeleteStudent(int rollNo)
        {
            try
            {
                var existingStudent = _context.Students.FirstOrDefault(x => x.RollNo == rollNo);
                if (existingStudent is null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                _context.Students.Remove(existingStudent);
                _context.SaveChanges();
                return Ok(new { message = "Student deleted successfully" });
            }
            catch (DbUpdateException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Unable to delete student due to a database error." });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while deleting the student." });
            }
        }
    }
}
