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
        protected SettingListenerAttribute(string settingPath) : base(settingPath) { }
    }

    //Binds to IGlobalValueSetting<T>.OnValueChanged - fires when the setting's saved value changes
    public sealed class SettingOnValueChangedAttribute : SettingListenerAttribute
    {
        public SettingOnValueChangedAttribute(string settingPath) : base(settingPath) { }
    }

    //Binds to IGlobalModSetting.OnSettingChanged - fires whenever the setting is applied
    public sealed class SettingOnAppliedAttribute : SettingListenerAttribute
    {
        public SettingOnAppliedAttribute(string settingPath) : base(settingPath) { }
    }

    //Binds to IValueModSetting<T>.OnSelectedChanged - fires when the UI-selected value changes
    public sealed class SettingOnSelectedChangedAttribute : SettingListenerAttribute
    {
        public SettingOnSelectedChangedAttribute(string settingPath) : base(settingPath) { }
    }

    //Binds to IModSetting.OnEnabled - fires when the setting is enabled or disabled
    public sealed class SettingOnEnabledAttribute : SettingListenerAttribute
    {
        public SettingOnEnabledAttribute(string settingPath) : base(settingPath) { }
    }
}
