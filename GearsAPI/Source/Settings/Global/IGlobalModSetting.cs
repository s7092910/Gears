
namespace GearsAPI.Settings.Global
{
    public interface IGlobalModSetting : IModSetting
    {

        /// <summary>
        /// What changing this setting costs the player. Global settings only: a world setting
        /// belongs to a save and is applied along with it, so it has nothing to restart.
        /// </summary>
        SettingRestartScope RestartScope { get; set; }

        event OnSettingChangedEvent OnSettingChanged;

        IGlobalModSettingsCategory Category { get; }

        IGlobalModSettingsTab Tab { get; }

    }

    public delegate void OnSettingChangedEvent(IGlobalModSetting setting);

}

