using Backend.Data;
using Backend.Filters;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static Backend.Enumeartions.AppEnumerations;

namespace Backend.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly AppDbContext appContext;

        public UserController(AppDbContext context) 
        {
            appContext = context; 
        }

        [HttpDelete]
        [Route("{entryRole}/{name}/{ID}")]
        [ServiceFilter(typeof(CustomFilter1))]
        public IActionResult DeleteUser([FromRoute] string name, string entryRole, int ID)
        {
            if(entryRole == ERoles.Teacher.ToString())
            {
                var teacher = appContext.Teachers.Where(x => x.TeacherID == ID).FirstOrDefault();
                if (teacher is not null) 
                    appContext.Teachers.Remove(teacher);
                appContext.SaveChanges();
                return Ok(new { message = "Entry Deleted Successfully" });
            }
            else if(entryRole == ERoles.Student.ToString())
            {
                //var student = appContext.Students.Where(x => x.Id == ID.ToString()).FirstOrDefault();
                //if (student is not null)
                //    appContext.Students.Remove(student);
                //appContext.SaveChanges();
                //return Ok(new { message = "Entry Deleted Successfully" });
            }
            return NotFound(new { message = "entry deletion is unsuccessful. Entry not found" });
        }


        [HttpGet]
        [Route("student/{name}/{role}")]
        public IActionResult GetEntryDetails([FromRoute]string name, string role)
        {
            if (role == ERoles.Teacher.ToString())
            {
                var teachersList = appContext.Teachers.Where(x => x.Name.Contains(name)).ToList();
                return Ok(new { entryDetails = teachersList });
            }
            else if(role == ERoles.Student.ToString())
            {
                //var studentsList = appContext.Students.Where(x => x.Name.Contains(name)).ToList();
                //return Ok(new { entryDetails = studentsList });
            }
            return NotFound(new {message = "Details not Found"});
        }

        [HttpPost("/addTeacher")]
        public IActionResult AddEntry([FromForm] Teacher obj, [FromQuery] string addType, [FromQuery] string Role)
        {
            if(Role == ERoles.Teacher.ToString())
            {
                var teacher = (Teacher)obj;
                if(teacher is not null)
                {
                    var dataExist = appContext.Teachers.Where(x => x.Email == teacher.Email).First();

                    if(dataExist is not null && addType == EEntryUpdationType.Update.ToString())
                    {
                        var isDataUpdated = false;
                        foreach(var item in dataExist.GetType().GetProperties())
                        {
                            if(item.GetValue(dataExist) != item.GetValue(teacher))
                            {
                                isDataUpdated = true;
                            }
                        }

                        if(isDataUpdated)
                        {
                            appContext.Teachers.Remove(dataExist);
                            appContext.Teachers.Add(dataExist);
                            appContext.SaveChanges();
                            return Ok(new {message = "data updated successfully"});
                        }
                        else
                        {
                            return Ok(new { message = "No changes found" });
                        }
                    }
                    else if (dataExist is not null && addType == EEntryUpdationType.Add.ToString())
                    {
                        return Conflict(new { message = "Data already exists" });
                    }
                    else
                    {
                        appContext.Teachers.Add(teacher);
                        appContext.SaveChanges();
                        return Ok(new {message = "Data added successfully"});
                    }
                }
            }
            //else if(type == ERoles.Student.ToString())
            //{
            //    var student = (Student)obj;

            //    if(student is not null)
            //    {
            //        var dataExist = appContext.Students.Where(x => x.Email == student.Email).First();

            //        if (dataExist is not null && AdditionType == EEntryUpdationType.Update.ToString())
            //        {
            //            var isDataUpdated = false;
            //            foreach (var item in dataExist.GetType().GetProperties())
            //            {
            //                if (item.GetValue(dataExist) != item.GetValue(student))
            //                {
            //                    isDataUpdated = true;
            //                }
            //            }

            //            if (isDataUpdated)
            //            {
            //                appContext.Students.Remove(dataExist);
            //                appContext.Students.Add(dataExist);
            //                appContext.SaveChanges();
            //                return Ok(new { message = "data updated successfully" });
            //            }
            //            else
            //            {
            //                return Ok(new { message = "No changes found" });
            //            }
            //        }
            //        else if (dataExist is not null && AdditionType == EEntryUpdationType.Add.ToString())
            //        {
            //            return Conflict(new { message = "Data already exists" });
            //        }
            //        else
            //        {
            //            appContext.Students.Add(student);
            //            appContext.SaveChanges();
            //            return Ok(new { message = "Data added successfully" });
            //        }
            //    }
            //}
            return NotFound();
        }
    }
}
