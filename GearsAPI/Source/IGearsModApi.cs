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
        /// Called at <c>GameAwake</c> after all <c>IGearsModApi</c> instances exist and before any <c>ModSettings.xml</c> is read. The settings tree is empty; create settings from code here.
        /// </summary>
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
