using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a class as containing static methods tagged with
    /// [SettingParser] / [SettingFormatter], so the scanner knows to look inside it.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class SettingsSerializationProvider : Attribute
    {
    }
}
