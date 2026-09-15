
using System;
using System.Collections.Generic;

namespace GearsAPI.Settings.World
{
    public interface IModWorldSettings
    {
        IWorldModSettingsCategory GetCategory(string categoryName);
        IWorldModSettingsCategory CreateCategory(string categoryName, string displayName);
        IWorldModSettingsCategory GetOrCreateCategory(string categoryName, string displayName);

        bool AddCategory(IWorldModSettingsCategory category);

        bool RemoveCategory(string categoryName);

        bool RemoveCategory(IWorldModSettingsCategory category);

        List<IWorldModSettingsCategory> GetAllCategories();

        List<IWorldModSetting> GetAllWorldSettings();

        /// <summary>
        /// Connects the tagged static members of <paramref name="settingsType"/> to the settings they name,
        /// using the path format "CategoryName.SettingName". Fields and properties tagged <c>[Setting]</c> are
        /// assigned their setting; methods tagged <c>[SettingOnSelected]</c> or <c>[SettingOnEnabled]</c> are subscribed to
        /// the matching event. Call this from OnWorldSettingsLoaded, which can fire more than once per
        /// session: re-binding a field is harmless, but re-subscribing a listener adds a second handler.
        /// </summary>
        void BindSettingsClass(Type settingsType);

        void SaveSettings();
    }
}
