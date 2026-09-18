using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Binds a static field or property to the setting its path names. Pass the declaring type to
    /// <c>BindSettingsClass</c> and the member is assigned the resolved setting.
    /// A field must be static and neither <c>readonly</c> nor <c>const</c>; a property must be static
    /// and have a setter, which may be private.
    /// </summary>
    /// <remarks>
    /// <c>BindSettingsClass</c> assigns the resolved setting into the member before it subscribes any
    /// listener on the same type. The member's declared type must be one the setting actually
    /// implements — anything from <see cref="IModSetting"/> down to the concrete class. Anything
    /// else is logged and skipped. See the C# Setting Listeners guide.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
    public sealed class SettingAttribute : SettingPathAttribute
    {
        /// <summary>
        /// Initializes the attribute with the setting path.
        /// </summary>
        public SettingAttribute(string settingPath) : base(settingPath) { }
    }
}
