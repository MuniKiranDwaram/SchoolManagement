using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend.Filters
{
    public abstract class CustomFilter1 : IResourceFilter
    {

        public void OnResourceExecuted(ResourceExecutedContext context)
        {
            throw new NotImplementedException();
        }

        public void OnResourceExecuting(ResourceExecutingContext context)
        {
            throw new NotImplementedException();
        }
    }
}
