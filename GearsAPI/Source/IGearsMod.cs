using GearsAPI.Settings.Global;
using GearsAPI.Settings.World;

namespace GearsAPI.Settings
{
    /// <summary>
    /// What Gears knows about one loaded mod: its settings trees, icon and banner.
    /// </summary>
    /// <remarks>
    /// What Gears knows about one loaded mod: the game's <c>Mod</c>, its global and world settings, and the
    /// optional icon and banner declared in <c>ModInfo.xml</c>. Handed to
    /// <see cref="IGearsModApi.InitMod"/> and returned by <see cref="GearsSettingsManager"/>.
    /// </remarks>
    public interface IGearsMod
    {
        /// <summary>
        /// Gets the game's <c>Mod</c> object for this mod.
        /// </summary>
        Mod Mod { get; }

        /// <summary>
        /// Gets the mod's global settings tree as an <see cref="IModGlobalSettings"/>. Never <c>null</c>; empty for a mod that declares none.
        /// </summary>
        IModGlobalSettings GlobalSettings { get; }

        /// <summary>
        /// Gets the mod's world settings tree as an <see cref="IModWorldSettings"/>. Never <c>null</c>; empty for a mod that declares none.
        /// </summary>
        IModWorldSettings WorldSettings { get; }

        /// <summary>
        /// Gets or sets the banner image path, relative to the mod folder. Seeded from <c>&lt;Banner value&gt;</c> in <c>ModInfo.xml</c>.
        /// </summary>
        string BannerPath { get; set; }

        /// <summary>
        /// Gets or sets the icon image path, relative to the mod folder. Seeded from <c>&lt;Icon value&gt;</c> in <c>ModInfo.xml</c>.
        /// </summary>
        string IconPath { get; set; }

        /// <summary>
        /// Returns <c>true</c> if at least one <see cref="IGearsModApi"/> implementation was found in the mod's assemblies.
        /// </summary>
        bool HasGearsApi();

        /// <summary>
        /// Returns <c>true</c> if the mod has at least one global tab.
        /// </summary>
        bool HasGlobalSettings();

        /// <summary>
        /// Returns <c>true</c> if the mod has at least one world setting.
        /// </summary>
        bool HasWorldSettings();

        /// <summary>
        /// Returns <c>true</c> if <c>BannerPath</c> is set and the file exists.
        /// </summary>
        bool HasBanner();

        /// <summary>
        /// Returns <c>true</c> if <c>IconPath</c> is set and the file exists.
        /// </summary>
        bool HasIcon();

        /// <summary>
        /// Writes the player-level saved settings file now, including this mod's current global values. Returns <c>true</c> if the file exists afterwards.
        /// </summary>
        bool SaveSettings();
    }

}
