
namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A setting that belongs to the player rather than to a world.
    /// </summary>
    /// <remarks>
    /// A setting that belongs to the player rather than to a world: it knows its tab and category, can
    /// warn about a reload or restart, and raises <c>OnSettingApplied</c> when applied.
    /// </remarks>
    public interface IGlobalModSetting : IModSetting
    {

        /// <summary>
        /// What changing this setting costs the player. Global settings only: a world setting
        /// belongs to a save and is applied along with it, so it has nothing to restart.
        /// </summary>
        SettingRestartScope RestartScope { get; set; }

        /// <summary>
        /// Occurs when <c>ApplyCurrentChange()</c> runs, whether or not the value differs. Type
        /// <see cref="OnSettingAppliedEvent"/>.
        /// </summary>
        event OnSettingAppliedEvent OnSettingApplied;

        /// <summary>
        /// Gets the <see cref="IGlobalModSettingsCategory"/> this setting belongs to.
        /// </summary>
        IGlobalModSettingsCategory Category { get; }

        /// <summary>
        /// Gets the <see cref="IGlobalModSettingsTab"/> this setting belongs to.
        /// </summary>
        IGlobalModSettingsTab Tab { get; }

    }

    /// <summary>
    /// Handler for <c>IGlobalModSetting.OnSettingApplied</c>. Carries no value.
    /// </summary>
    /// <remarks>
    /// Handler for <see cref="IGlobalModSetting.OnSettingApplied"/>. Carries no value; read
    /// <c>SettingValue</c> from the setting if it is a value setting.
    /// </remarks>
    /// <param name="setting">The setting that was applied.</param>
    public delegate void OnSettingAppliedEvent(IGlobalModSetting setting);

}

