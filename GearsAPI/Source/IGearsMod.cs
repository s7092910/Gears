using GearsAPI.Settings.Global;
using GearsAPI.Settings.World;

namespace GearsAPI.Settings
{
    public interface IGearsMod 
    {
        Mod Mod { get; }

        IModGlobalSettings GlobalSettings { get; }

        IModWorldSettings WorldSettings { get; }

        string BannerPath { get; set; }

        string IconPath { get; set; }

        bool HasGearsApi();

        bool HasGlobalSettings();

        bool HasWorldSettings();

        bool HasBanner();

        bool HasIcon();

        bool SaveSettings();
    }

}
