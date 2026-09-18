using GearsAPI.Settings.Global;
using GearsAPI.Settings.World;
using GearsAPI.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI
{

    /// <summary>
    /// The game's <c>IModApi</c> entry point for <c>GearsAPI.dll</c> itself. Not intended for use by mods.
    /// </summary>
    /// <remarks>
    /// The game's <c>IModApi</c> entry point for <c>GearsAPI.dll</c> itself. It logs the GearsAPI version when
    /// the game loads the assembly. Not intended for use by mods.
    /// </remarks>
    public class GearsApi : IModApi
    {
        /// <summary>
        /// Logs <c>[Gears API] Gears API version &lt;version&gt; loaded</c>. Implements <c>IModApi.InitMod</c>.
        /// </summary>
        public void InitMod(Mod _modInstance)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            string version = assembly.GetName().Version.ToString();
            Log.Out(string.Format("[Gears API] Gears API version {0} loaded", version));
        }
    }
}
