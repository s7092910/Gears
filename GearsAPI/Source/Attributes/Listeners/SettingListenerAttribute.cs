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
    /// Binds a static method to <c>OnValueChanged</c>. Raised on global value settings; on a world
    /// path the method is bound invoke-only.
    /// </summary>
    /// <remarks>
    /// Binds a static method to the named setting's <c>OnValueChanged</c> event
    /// (<see cref="IGlobalValueSetting{T}"/>), which fires when the applied value changes. Required
    /// method signature: <c>static void M(IValueModSetting&lt;T&gt; setting, T newValue)</c>.
    /// Pass <c>includeInSync: true</c> to have <c>SyncSettingsToClass</c> call the method with the
    /// setting's current <c>SettingValue</c>.
    /// <para>
    /// A world setting raises no <c>OnValueChanged</c> - its applied value arrives with the world
    /// rather than changing under the player - so on a world path the method is bound
    /// <b>invoke-only</b>: never raised, and run only by <c>SyncSettingsToClass</c>. That makes
    /// <c>includeInSync: true</c> mandatory there, or the method can never run at all.
    /// </para>
    /// </remarks>
    public sealed class SettingOnValueChangedAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Gets whether <c>SyncSettingsToClass</c> calls this listener with the setting's current
        /// <c>SettingValue</c>. Defaults to <c>false</c>, which leaves the listener running only when
        /// its event fires.
        /// </summary>
        public bool IncludeInSync { get; }

        /// <summary>
        /// Initializes the attribute with the setting path, and optionally opts the listener in to
        /// <c>SyncSettingsToClass</c>.
        /// </summary>
        public SettingOnValueChangedAttribute(string settingPath, bool includeInSync = false) : base(settingPath)
        {
            IncludeInSync = includeInSync;
        }
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
    /// Pass <c>includeInSync: true</c> to have <c>SyncSettingsToClass</c> call the method with the
    /// setting's current <c>SelectedValue</c>.
    /// </remarks>
    public sealed class SettingOnSelectedChangedAttribute : SettingListenerAttribute
    {
        /// <summary>
        /// Gets whether <c>SyncSettingsToClass</c> calls this listener with the setting's current
        /// <c>SelectedValue</c>. Defaults to <c>false</c>, which leaves the listener running only when
        /// its event fires.
        /// </summary>
        public bool IncludeInSync { get; }

        /// <summary>
        /// Initializes the attribute with the setting path, and optionally opts the listener in to
        /// <c>SyncSettingsToClass</c>.
        /// </summary>
        public SettingOnSelectedChangedAttribute(string settingPath, bool includeInSync = false) : base(settingPath)
        {
            IncludeInSync = includeInSync;
        }
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
