using System.Collections.Generic;

namespace GearsAPI.Settings.World
{
    public interface IWorldModSettingsCategory : IWorldModSetting
    {
        IWorldModSetting GetSetting(string name);

        T GetSetting<T>(string name) where T : class, IWorldModSetting;

        T CreateSetting<T>(string name, string displayKey) where T : class, IWorldModSetting;

        T GetOrCreateSetting<T>(string name, string displayName) where T : class, IWorldModSetting;

        bool AddSetting(IWorldModSetting setting);

        bool RemoveSetting(string settingName);

        bool RemoveSetting(IWorldModSetting setting);

        List<IWorldModSetting> GetAllSettings();

    }
}
