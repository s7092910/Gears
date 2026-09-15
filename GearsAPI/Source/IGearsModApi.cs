using GearsAPI.Settings.Global;
using GearsAPI.Settings.World;

namespace GearsAPI.Settings
{

    public interface IGearsModApi
    {
        void InitMod(IGearsMod modInstance);

        void OnGlobalSettingsLoaded(IModGlobalSettings modSettings);

        void OnWorldSettingsLoaded(IModWorldSettings worldSettings);

    }
}
