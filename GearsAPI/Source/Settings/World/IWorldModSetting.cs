namespace GearsAPI.Settings.World
{
    /// <summary>
    /// A setting that belongs to a save. No <c>RestartScope</c>, no <c>OnSettingApplied</c>.
    /// </summary>
    /// <remarks>
    /// A setting that belongs to a save. Has no <c>RestartScope</c> and no <c>OnSettingApplied</c>.
    /// </remarks>
    public interface IWorldModSetting : IModSetting
    {
        /// <summary>
        /// Gets the <see cref="IWorldModSettingsCategory"/> this setting belongs to.
        /// </summary>
        IWorldModSettingsCategory Category { get; }

    }

}
