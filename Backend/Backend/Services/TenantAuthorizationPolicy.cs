namespace Backend.Services
{
    public class TenantAuthorizationPolicy
    {
        private readonly TenantContext _tenantContext;

        public TenantAuthorizationPolicy(TenantContext tenantContext)
        {
            _tenantContext = tenantContext;
        }

        public Task<bool> AuthorizeAsync(string? requestedTenantSlug)
        {
            if (string.IsNullOrWhiteSpace(requestedTenantSlug))
            {
                return Task.FromResult(false);
            }

            if (string.IsNullOrWhiteSpace(_tenantContext.CurrentSlug))
            {
                return Task.FromResult(false);
            }

            return Task.FromResult(string.Equals(_tenantContext.CurrentSlug, requestedTenantSlug, StringComparison.OrdinalIgnoreCase));
        }
    }
}
