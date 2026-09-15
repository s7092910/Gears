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

    public class GearsApi : IModApi
    {
        public void InitMod(Mod _modInstance)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            string version = assembly.GetName().Version.ToString();
            Log.Out(string.Format("[Gears API] Gears API version {0} loaded", version));
        }
    }
}
