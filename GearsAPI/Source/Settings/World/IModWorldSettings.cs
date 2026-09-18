
using System;
using System.Collections.Generic;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// The root of a mod's world settings. No tab level; categories sit directly here.
    /// </summary>
    /// <remarks>
    /// The root of a mod's world settings. There is no tab level; categories sit directly here. Handed
    /// to <see cref="IGearsModApi.OnWorldSettingsLoaded"/>; also <see cref="IGearsMod.WorldSettings"/>.
    /// </remarks>
    public interface IModWorldSettings
    {
        /// <summary>
        /// Returns the <see cref="IWorldModSettingsCategory"/> named <paramref name="categoryName"/>, or <c>null</c>.
        /// </summary>
        IWorldModSettingsCategory GetCategory(string categoryName);

        /// <summary>
        /// Creates a category with the given name and display key. Throws <c>ArgumentException</c> on a duplicate name.
        /// </summary>
        IWorldModSettingsCategory CreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Returns the existing category, or creates it.
        /// </summary>
        IWorldModSettingsCategory GetOrCreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Adds an existing category object. Returns <c>false</c> if the name is taken.
        /// </summary>
        bool AddCategory(IWorldModSettingsCategory category);

        /// <summary>
        /// Removes the category with that name. Returns whether one was removed.
        /// </summary>
        bool RemoveCategory(string categoryName);

        /// <summary>
        /// Removes that category. Returns whether it was removed.
        /// </summary>
        bool RemoveCategory(IWorldModSettingsCategory category);

        /// <summary>
        /// Returns every category as a <c>List&lt;IWorldModSettingsCategory&gt;</c>.
        /// </summary>
        List<IWorldModSettingsCategory> GetAllCategories();

        /// <summary>
        /// Returns every setting in every category, categories included, as a <c>List&lt;IWorldModSetting&gt;</c>.
        /// </summary>
        List<IWorldModSetting> GetAllWorldSettings();

        /// <summary>
        /// Scans <paramref name="settingsType"/> for tagged static members carrying a <c>"Category.Setting"</c>
        /// path. Fields and properties tagged [<see cref="SettingAttribute"/>] are assigned the named setting
        /// first, then methods tagged [<see cref="SettingOnSelectedChangedAttribute"/>] or
        /// [<see cref="SettingOnEnabledAttribute"/>] are subscribed. [<see cref="SettingOnValueChangedAttribute"/>]
        /// and [<see cref="SettingOnAppliedAttribute"/>] are logged and skipped: world settings have neither
        /// event. Throws <c>ArgumentNullException</c> for <c>null</c>. Re-binding a field on a later world load
        /// is harmless; re-subscribing a listener adds a second handler.
        /// </summary>
        void BindSettingsClass(Type settingsType);

        /// <summary>
        /// Writes the player-level saved settings file. World values themselves are written to the save
        /// folder by the world settings screen and on world start, not by this call.
        /// </summary>
        void SaveSettings();
    }
}
