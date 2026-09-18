using InControl;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global key-binding row. Not a value setting.
    /// </summary>
    /// <remarks>
    /// A global key-binding row. Not a value setting: it has no <c>SettingValue</c>, is not saved by
    /// Gears, and returns an empty string from <c>modsetting()</c>. The mod attaches the game
    /// <c>PlayerAction</c> the row rebinds.
    /// </remarks>
    public interface IControlBindingSetting : IGlobalModSetting
    {
        /// <summary>
        /// Gets or sets the <c>InControl.PlayerAction</c> this row rebinds. <c>null</c> until the mod
        /// assigns it.
        /// </summary>
        PlayerAction PlayerAction { get; set; }

        /// <summary>
        /// Removes every binding from <c>PlayerAction</c>.
        /// </summary>
        void ClearBinding();

    }
}
