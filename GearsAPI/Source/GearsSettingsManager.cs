using System.Collections.Generic;

namespace GearsAPI.Settings
{
    /// <summary>
    /// Static access to every mod Gears knows about, without waiting for a callback.
    /// </summary>
    /// <remarks>
    /// Static access to every mod Gears knows about, for code that wants a setting without waiting for
    /// an <see cref="IGearsModApi"/> callback. Populated by Gears at <c>GameAwake</c>; before that, both methods
    /// return empty results.
    /// </remarks>
    public abstract class GearsSettingsManager
    {
        protected static GearsSettingsManager instance;

        /// <summary>
        /// Returns every loaded mod as a <c>List&lt;IGearsMod&gt;</c>, in the game's load order. Returns an empty list before Gears has initialised.
        /// </summary>
        public static List<IGearsMod> GetMods()
        {
            if(null == instance)
            {
                return new List<IGearsMod>();
            }
            return instance.GetModsInternal();
        }

        /// <summary>
        /// Returns the <see cref="IGearsMod"/> whose <c>ModInfo.xml</c> <c>&lt;Name&gt;</c> equals <c>modName</c>, or <c>null</c> if there is none or Gears has not initialised.
        /// </summary>
        public static IGearsMod GetGearsMod(string modName)
        {
            if (instance == null)
            {
                return null;
            }
            return instance.GetGearsModInternal(modName);
        }

        protected internal abstract List<IGearsMod> GetModsInternal();

        protected internal abstract IGearsMod GetGearsModInternal(string modName);
    }
}
