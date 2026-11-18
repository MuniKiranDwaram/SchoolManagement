namespace Backend.AppExtensions
{
    public static class AppExtensions
    {
        public static void CopyProperties<T>(T target, T source)
        {
            var props = typeof(T).GetProperties().Where(p => p.CanRead && p.CanWrite);
            foreach (var prop in props)
            {
                var value = prop.GetValue(source, null);
                prop.SetValue(target, value);
            }
        }
    }
}
