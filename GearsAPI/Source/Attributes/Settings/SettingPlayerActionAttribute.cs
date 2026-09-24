using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Assigns the <c>PlayerAction</c> held by a static field or property to the Binding setting its
    /// path names. Pass the declaring type to <c>BindSettingsClass</c> and Gears reads the member and
    /// sets <c>IControlBindingSetting.PlayerAction</c> from it.
    /// </summary>
    /// <remarks>
    /// Works the other way round from <see cref="SettingAttribute"/>: Gears reads the member rather
    /// than writing to it. The member must be static and declared as <c>InControl.PlayerAction</c> or
    /// a class derived from it. A field may be <c>readonly</c>; a property needs a getter, which may
    /// be private. The path must name a Binding setting, so it is always a global path,
    /// <c>"tabName.CategoryName.SettingName"</c>.
    /// <para>
    /// Gears reads the member once, while <c>BindSettingsClass</c> runs, and never again.
    /// <c>SyncSettingsToClass</c> does not read it. Create your <c>PlayerActionSet</c> before you
    /// bind: a member that is <c>null</c> at that point is logged and skipped, and the row reads
    /// "- Missing PlayerAction -". Every other problem is also logged and skips that member only.
    /// See the Bind Settings with Attributes guide.
    /// </para>
    /// </remarks>
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
    public sealed class SettingPlayerActionAttribute : SettingPathAttribute
    {
        /// <summary>
        /// Initializes the attribute with the path of the Binding setting.
        /// </summary>
        public SettingPlayerActionAttribute(string settingPath) : base(settingPath) { }
    }
}
