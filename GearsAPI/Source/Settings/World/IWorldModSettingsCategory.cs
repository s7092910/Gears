using System.Collections.Generic;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// A category of world settings. Like its global counterpart, itself a setting.
    /// </summary>
    /// <remarks>
    /// A category of world settings. Like its global counterpart, a category is itself a setting.
    /// </remarks>
    public interface IWorldModSettingsCategory : IWorldModSetting
    {
        /// <summary>
        /// Returns the <see cref="IWorldModSetting"/> named <paramref name="name"/>, or <c>null</c>.
        /// </summary>
        IWorldModSetting GetSetting(string name);

        /// <summary>
        /// Returns the setting named <paramref name="name"/> as <typeparamref name="T"/>, or <c>null</c>
        /// if there is none or it is not a <typeparamref name="T"/>. <typeparamref name="T"/> must be a
        /// class implementing <see cref="IWorldModSetting"/>.
        /// </summary>
        T GetSetting<T>(string name) where T : class, IWorldModSetting;

        /// <summary>
        /// Creates a setting of interface <typeparamref name="T"/>. Same exceptions as the global version.
        /// Setting names must be unique across **all** of the mod's world categories, because saved world
        /// values are looked up by name alone.
        /// </summary>
        T CreateSetting<T>(string name, string displayKey) where T : class, IWorldModSetting;

        /// <summary>
        /// Returns the existing setting as <typeparamref name="T"/>, or creates it.
        /// </summary>
        T GetOrCreateSetting<T>(string name, string displayName) where T : class, IWorldModSetting;

        /// <summary>
        /// Adds an existing setting object. Returns <c>false</c> if the name is taken.
        /// </summary>
        bool AddSetting(IWorldModSetting setting);

        /// <summary>
        /// Removes the setting with that name.
        /// </summary>
        bool RemoveSetting(string settingName);

        /// <summary>
        /// Removes that setting.
        /// </summary>
        bool RemoveSetting(IWorldModSetting setting);

        /// <summary>
        /// Returns the category itself followed by its settings, as a <c>List&lt;IWorldModSetting&gt;</c>.
        /// </summary>
        List<IWorldModSetting> GetAllSettings();

    }
}
