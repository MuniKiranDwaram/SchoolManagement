using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.AppExtensions;
using static Backend.Enumeartions.AppEnumerations;
using Microsoft.AspNetCore.Http.HttpResults;
using Backend.Filters;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("[controller]")]
    public class TeacherController : Controller
    {
        private AppDbContext Context { get; set; }

        public TeacherController(AppDbContext context)
        {
            Context = context;
        }

        private static string NormalizeText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
        }

        private static string NormalizeName(string? value)
        {
            return NormalizeText(value).ToUpperInvariant();
        }

        private static bool IsTeacherDataValid(Teacher teacher)
        {
            return teacher is not null
                && !string.IsNullOrWhiteSpace(teacher.Name)
                && !string.IsNullOrWhiteSpace(teacher.Designation)
                && !string.IsNullOrWhiteSpace(teacher.Subject)
                && teacher.Class > 0
                && teacher.DOB != default
                && teacher.DOJ != default
                && !string.IsNullOrWhiteSpace(teacher.Email)
                && !string.IsNullOrWhiteSpace(teacher.Phone)
                && !string.IsNullOrWhiteSpace(teacher.Salary)
                && !string.IsNullOrWhiteSpace(teacher.Address);
        }

        [Route("addTeacher")]
        [HttpPost]
        public IActionResult AddTeacher([FromForm] Teacher teacher, [FromQuery] string addType)
        {
            try
            {
                if (teacher is null)
                {
                    return BadRequest(new { message = "Teacher data is required." });
                }

                teacher.Name = NormalizeName(teacher.Name);
                teacher.Designation = NormalizeName(teacher.Designation);
                teacher.Subject = NormalizeName(teacher.Subject);
                teacher.Email = NormalizeText(teacher.Email).ToLowerInvariant();
                teacher.Phone = NormalizeText(teacher.Phone);
                teacher.Salary = NormalizeText(teacher.Salary);
                teacher.Address = NormalizeText(teacher.Address);

                if (!IsTeacherDataValid(teacher))
                {
                    return BadRequest(new { message = "Required teacher fields are missing: Name, Designation, Subject, Class, DOB, DOJ, Email, Phone, Salary and Address." });
                }

                if (string.IsNullOrWhiteSpace(addType))
                {
                    return BadRequest(new { message = "Operation type is required." });
                }

                if (addType == EEntryUpdationType.Add.ToString())
                {
                    if (Context.Teachers.Any(x => x.Email.ToLower() == teacher.Email.ToLower()))
                    {
                        return Conflict(new { message = "User already exists" });
                    }

                    Context.Teachers.Add(teacher);
                    Context.SaveChanges();
                    return Ok(new { message = "Teacher details saved successfully" });
                }

                if (addType == EEntryUpdationType.Update.ToString())
                {
                    var entry = Context.Teachers.FirstOrDefault(x => x.Email.ToLower() == teacher.Email.ToLower());
                    if (entry is null)
                    {
                        return NotFound(new { message = "Teacher details not found" });
                    }

                    entry.Name = teacher.Name;
                    entry.Designation = teacher.Designation;
                    entry.Subject = teacher.Subject;
                    entry.Class = teacher.Class;
                    entry.DOB = teacher.DOB;
                    entry.DOJ = teacher.DOJ;
                    entry.Email = teacher.Email;
                    entry.Phone = teacher.Phone;
                    entry.Salary = teacher.Salary;
                    entry.Address = teacher.Address;

                    Context.SaveChanges();
                    return Ok(new { message = "Teacher Details Updated Successfully" });
                }

                return BadRequest(new { message = "Invalid operation type." });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Unable to save teacher details. Please check the required fields and database schema." + ex.InnerException?.Message });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while processing teacher details." });
            }
        }

        [HttpPut]
        [Route("updateTeacher")]
        public IActionResult UpdateTeacher(Teacher teacher)
        {
            try
            {
                if (teacher is null)
                {
                    return BadRequest(new { message = "Teacher data is required." });
                }

                var user = Context.Teachers.FirstOrDefault(x => x.Email.ToLower() == teacher.Email.ToLower());
                if (user is null)
                {
                    return NotFound(new { message = "User not found" });
                }

                AppExtensions.AppExtensions.CopyProperties(user, teacher);
                Context.SaveChanges();
                return Ok(new { message = "User updated Successfully" });
            }
            catch (DbUpdateException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Unable to update teacher details due to a database error." });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while updating the teacher." });
            }
        }

        [HttpGet]
        [Route("searchTeacher")]
        public IActionResult GetTeacherDetails([FromQuery] string teacher)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(teacher))
                {
                    return Ok(new List<Teacher>());
                }

                var searchName = teacher.Trim();
                var teachersList = Context.Teachers
                    .Where(x => x.Name != null && x.Name.ToLower().Contains(searchName.ToLower()))
                    .OrderBy(x => x.Name)
                    .ToList();

                if (!teachersList.Any())
                {
                    return Ok(new List<Teacher>());
                }

                return Ok(teachersList);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while searching teacher details." });
            }
        }
    }
}
