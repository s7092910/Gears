using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Base for attributes that bind a static method to a setting's event.
    /// The setting path must be in the form "tabName.CategoryName.SettingName" for global settings
    /// and "CategoryName.SettingName" for world settings.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
    public abstract class SettingListenerAttribute : SettingPathAttribute
    {
        /// <summary>
        /// Protected. Passes <paramref name="settingPath"/> to the base constructor.
        /// </summary>
        protected SettingListenerAttribute(string settingPath) : base(settingPath) { }
    }

    /// <summary>
    /// Binds a static method to <c>OnValueChanged</c>. Global value settings only.
    /// </summary>
    /// <remarks>
    /// Binds a static method to the named setting's <c>OnValueChanged</c> event
    /// (<see cref="IGlobalValueSetting{T}"/>), which fires when the applied value changes. Global value
    /// settings only. Required method signature: <c>static void M(IValueModSetting&lt;T&gt; setting, T newValue)</c>.
    /// </remarks>
    public sealed class SettingOnValueChangedAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Initializes the attribute with the setting path.
        /// </summary>
        public SettingOnValueChangedAttribute(string settingPath) : base(settingPath) { }
    }

    /// <summary>
    /// Binds a static method to <c>OnSettingApplied</c>. Global settings only.
    /// </summary>
    /// <remarks>
    /// Binds a static method to the named setting's <c>OnSettingApplied</c> event
    /// (<see cref="IGlobalModSetting"/>), which fires when the setting is applied. Global settings only,
    /// including Color and Binding. Required method signature: <c>static void M(IGlobalModSetting setting)</c>.
    /// </remarks>
    public sealed class SettingOnAppliedAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Initializes the attribute with the setting path.
        /// </summary>
        public SettingOnAppliedAttribute(string settingPath) : base(settingPath) { }
    }

    /// <summary>
    /// Binds a static method to <c>OnSelectedChanged</c>. Global and world value settings.
    /// </summary>
    /// <remarks>
    /// Binds a static method to the named setting's <c>OnSelectedChanged</c> event
    /// (<see cref="IValueModSetting{T}"/>), which fires when the value selected in the UI changes. Global
    /// and world value settings. Required method signature: <c>static void M(IValueModSetting&lt;T&gt; setting, T newValue)</c>.
    /// </remarks>
    public sealed class SettingOnSelectedChangedAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Initializes the attribute with the setting path.
        /// </summary>
        public SettingOnSelectedChangedAttribute(string settingPath) : base(settingPath) { }
    }

    /// <summary>
    /// Binds a static method to <c>OnEnabled</c>. Works on every setting.
    /// </summary>
    /// <remarks>
    /// Binds a static method to the named setting's <c>OnEnabled</c> event (<see cref="IModSetting"/>), which
    /// fires when <c>Enabled</c> changes to a different value. Declared on <c>IModSetting</c>, so it is the
    /// one listener that works on every setting, global and world. Required method signature:
    /// <c>static void M(IModSetting setting, bool isEnabled)</c>.
    /// </remarks>
    public sealed class SettingOnEnabledAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Initializes the attribute with the setting path.
        /// </summary>
        public SettingOnEnabledAttribute(string settingPath) : base(settingPath) { }
    }
}
