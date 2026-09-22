using GearsAPI.Settings.Global;
using GearsAPI.Settings.World;

namespace GearsAPI.Settings
{

    /// <summary>
    /// The callback contract a C# mod implements to be told about its settings.
    /// </summary>
    /// <remarks>
    /// The callback contract a C# mod implements to be told about its settings. Gears scans every
    /// assembly of a mod for concrete classes implementing this interface, instantiates each through its
    /// public parameterless constructor, and invokes every callback on every instance. See
    /// the Get Started with C# guide for the order and timing.
    /// </remarks>
    public interface IGearsModApi
    {
        /// <summary>
        /// Called at <c>GameAwake</c> once every mod's <c>ModSettings.xml</c> has been parsed, and
        /// before the player's saved global values are restored. Create settings from code here, and
        /// bind settings classes here.
        /// </summary>
        /// <remarks>
        /// The settings tree already holds everything <c>ModSettings.xml</c> declared, so
        /// <c>GetOrCreateTab</c> / <c>GetOrCreateSetting</c> hand back the XML's objects and anything
        /// this callback assigns onto them wins. A setting declared in both places must use the same
        /// type in both, or <c>GetOrCreateSetting</c> throws.
        /// <para>
        /// Because every setting exists by now, this is also where to call
        /// <c>BindSettingsClass</c>, for global and world settings alike. Values are not final yet -
        /// the saved global values are restored after this returns, silently - so ask for them with
        /// <c>SyncSettingsToClass</c> in <see cref="OnGlobalSettingsLoaded"/> rather than
        /// reading them here.
        /// </para>
        /// </remarks>
        void InitMod(IGearsMod modInstance);

        /// <summary>
        /// Called once every mod's <c>ModSettings.xml</c> has been parsed and the player's saved global values restored. Global values are final from here.
        /// </summary>
        void OnGlobalSettingsLoaded(IModGlobalSettings modSettings);

        /// <summary>
        /// Called when a world's settings become known: on world start when hosting, when the server's settings arrive when joining, or after a reset to defaults when the server sent none. May fire more than once per session. Not called for a mod with no world settings, and not called on the host for the <c>Empty</c> and <c>Playtesting</c> worlds the prefab editor uses.
        /// </summary>
        void OnWorldSettingsLoaded(IModWorldSettings worldSettings);

    }
}
