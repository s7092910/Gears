using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Binds a static field or property to the setting its path names. Pass the declaring type to
    /// <c>BindSettingsClass</c> and the member is assigned the resolved setting.
    /// A field must be static and neither <c>readonly</c> nor <c>const</c>; a property must be static
    /// and have a setter, which may be private.
    /// </summary>
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
    public sealed class SettingAttribute : SettingPathAttribute
    {
        public SettingAttribute(string settingPath) : base(settingPath) { }
    }
}
