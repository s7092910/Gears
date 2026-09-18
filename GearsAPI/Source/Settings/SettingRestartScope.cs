namespace GearsAPI.Settings
{
    /// <summary>
    /// What a change to a global setting costs the player.
    /// </summary>
    /// <remarks>
    /// What a change to a global setting costs the player. Shown as a warning in the settings window;
    /// Gears does not itself reload or restart anything. Used by <see cref="IGlobalModSetting.RestartScope"/>.
    /// </remarks>
    public enum SettingRestartScope
    {
        /// <summary>
        /// The change takes effect without a reload.
        /// </summary>
        None,
        /// <summary>
        /// The change needs the world to be reloaded.
        /// </summary>
        Reload, //Reload the game world
        /// <summary>
        /// The change needs the game to be restarted.
        /// </summary>
        Restart //Restart the game
    }
}
