using System.Collections.Generic;

namespace GearsAPI.Settings
{
    public abstract class GearsSettingsManager
    {
        protected static GearsSettingsManager instance;

        public static List<IGearsMod> GetMods()
        {
            if(null == instance)
            {
                return new List<IGearsMod>();
            }
            return instance.GetModsInternal();
        }

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
