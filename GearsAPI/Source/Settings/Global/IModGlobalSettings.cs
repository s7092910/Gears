using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// The root of a mod's global settings: the tabs, and operations across the whole tree.
    /// </summary>
    /// <remarks>
    /// The root of a mod's global settings: the tabs, and operations across the whole tree. Handed to
    /// <see cref="IGearsModApi.OnGlobalSettingsLoaded"/>; also <see cref="IGearsMod.GlobalSettings"/>.
    /// </remarks>
    public interface IModGlobalSettings
    {
        /// <summary>
        /// Returns the <see cref="IGlobalModSettingsTab"/> named <paramref name="name"/>, or <c>null</c>.
        /// </summary>
        IGlobalModSettingsTab GetTab(string name);

        /// <summary>
        /// Creates a tab whose display key is its name. Throws <c>ArgumentException</c> if a tab with
        /// that name exists.
        /// </summary>
        IGlobalModSettingsTab CreateTab(string name);

        /// <summary>
        /// Creates a tab with the given name and display key. Throws <c>ArgumentException</c> on a
        /// duplicate name.
        /// </summary>
        IGlobalModSettingsTab CreateTab(string name, string displayNameKey);

        /// <summary>
        /// Returns the existing tab named <paramref name="name"/>, or creates it with its name as
        /// display key.
        /// </summary>
        IGlobalModSettingsTab GetOrCreateTab(string name);

        /// <summary>
        /// Returns the existing tab named <paramref name="name"/>, or creates it with the given display
        /// key.
        /// </summary>
        IGlobalModSettingsTab GetOrCreateTab(string name, string displayNameKey);

        /// <summary>
        /// Returns every tab as a <c>List&lt;IGlobalModSettingsTab&gt;</c>.
        /// </summary>
        List<IGlobalModSettingsTab> GetTabs();

        /// <summary>
        /// Returns every setting in every category of every tab, categories included, as a
        /// <c>List&lt;IGlobalModSetting&gt;</c>.
        /// </summary>
        List<IGlobalModSetting> GetAllGlobalSettings();

        /// <summary>
        /// Scans <paramref name="settingsType"/> for tagged static members carrying a
        /// <c>"Tab.Category.Setting"</c> path. Fields and properties tagged <see cref="SettingAttribute"/>
        /// are assigned the named setting first, then methods tagged
        /// <see cref="SettingOnValueChangedAttribute"/>, <see cref="SettingOnSelectedChangedAttribute"/>,
        /// <see cref="SettingOnAppliedAttribute"/> or <see cref="SettingOnEnabledAttribute"/> are
        /// subscribed. Throws <c>ArgumentNullException</c> for <c>null</c>; every other problem is logged
        /// and that one member skipped. See the Bind Settings with Attributes guide.
        /// </summary>
        void BindSettingsClass(Type settingsType);

        /// <summary>
        /// Writes the player-level saved settings file now.
        /// </summary>
        void SaveSettings();

    }
}
