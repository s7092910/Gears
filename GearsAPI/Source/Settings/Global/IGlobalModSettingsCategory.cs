using System.Collections.Generic;

namespace GearsAPI.Settings.Global
{
    public interface IGlobalModSettingsCategory : IGlobalModSetting
    {
        IGlobalModSetting GetSetting(string name);

        T GetSetting<T>(string name) where T : class, IGlobalModSetting;

        T CreateSetting<T>(string name, string displayKey) where T : class, IGlobalModSetting;

        T GetOrCreateSetting<T>(string name, string displayName) where T : class, IGlobalModSetting;

        bool AddSetting(IGlobalModSetting setting);

        bool RemoveSetting(string settingName);

        bool RemoveSetting(IGlobalModSetting setting);

        List<IGlobalModSetting> GetAllSettings();

    }
}
