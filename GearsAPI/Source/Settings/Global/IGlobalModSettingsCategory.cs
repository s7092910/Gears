using System.Collections.Generic;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A category inside a tab. A category is itself a global setting.
    /// </summary>
    /// <remarks>
    /// A category inside a tab. A category is itself a global setting, which gives it a caption,
    /// description and preview image; its <c>RestartScope</c> always reads <c>None</c>.
    /// </remarks>
    public interface IGlobalModSettingsCategory : IGlobalModSetting
    {
        /// <summary>
        /// Returns the <see cref="IGlobalModSetting"/> named <paramref name="name"/>, or <c>null</c>.
        /// </summary>
        IGlobalModSetting GetSetting(string name);

        /// <summary>
        /// Returns the setting named <paramref name="name"/> as <typeparamref name="T"/>, or
        /// <c>null</c> if there is none or it is not a <typeparamref name="T"/>. <typeparamref name="T"/>
        /// must be a class implementing <see cref="IGlobalModSetting"/>.
        /// </summary>
        T GetSetting<T>(string name) where T : class, IGlobalModSetting;

        /// <summary>
        /// Creates a setting of interface <typeparamref name="T"/> with the given name and display key.
        /// Throws <c>ArgumentException</c> if <typeparamref name="T"/> is not a known setting interface,
        /// <c>InvalidOperationException</c> if its value type has no implementation or no registered
        /// parser, and <c>ArgumentException</c> on a duplicate name.
        /// </summary>
        T CreateSetting<T>(string name, string displayKey) where T : class, IGlobalModSetting;

        /// <summary>
        /// Returns the existing setting as <typeparamref name="T"/>, or creates it.
        /// </summary>
        T GetOrCreateSetting<T>(string name, string displayName) where T : class, IGlobalModSetting;

        /// <summary>
        /// Adds an existing setting object. Returns <c>false</c> if the name is taken.
        /// </summary>
        bool AddSetting(IGlobalModSetting setting);

        /// <summary>
        /// Removes the setting with that name. Returns whether one was removed.
        /// </summary>
        bool RemoveSetting(string settingName);

        /// <summary>
        /// Removes that setting. Returns whether it was removed.
        /// </summary>
        bool RemoveSetting(IGlobalModSetting setting);

        /// <summary>
        /// Returns the category itself followed by its settings, as a
        /// <c>List&lt;IGlobalModSetting&gt;</c>.
        /// </summary>
        List<IGlobalModSetting> GetAllSettings();

    }
}
