using Microsoft.AspNetCore.Http;

namespace Backend.Middlewares
{
    public class UserExistMiddleware : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var user = context.Request.Form["user"].ToString();
            context.Session.SetString("user", user ?? string.Empty);

            if (string.IsNullOrWhiteSpace(user))
            {
                await context.Response.WriteAsync("bad request");
                return;
            }

            await next(context);
        }
    }
}
