using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        [HttpGet("/health")]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "ok",
                timestampUtc = DateTime.UtcNow,
                service = "SchoolManagementAPI"
            });
        }
    }
}
