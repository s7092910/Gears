using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Global
{
    public interface IModGlobalSettings
    {
        IGlobalModSettingsTab GetTab(string name);

        IGlobalModSettingsTab CreateTab(string name);

        IGlobalModSettingsTab CreateTab(string name, string displayNameKey);

        IGlobalModSettingsTab GetOrCreateTab(string name);

        IGlobalModSettingsTab GetOrCreateTab(string name, string displayNameKey);

        List<IGlobalModSettingsTab> GetTabs();

        List<IGlobalModSetting> GetAllGlobalSettings();

        /// <summary>
        /// Connects the tagged static members of <paramref name="settingsType"/> to the settings they name,
        /// using the path format "tabName.CategoryName.SettingName". Fields and properties tagged
        /// <c>[Setting]</c> are assigned their setting; methods tagged <c>[SettingOnValueChanged]</c>,
        /// <c>[SettingOnSelected]</c>, <c>[SettingOnChanged]</c> or <c>[SettingOnEnabled]</c> are subscribed to the
        /// matching event. Call this once, from OnGlobalSettingsLoaded.
        /// </summary>
        void BindSettingsClass(Type settingsType);

        void SaveSettings();

    }
}
