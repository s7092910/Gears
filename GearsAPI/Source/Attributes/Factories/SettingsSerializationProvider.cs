using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a class as holding [<see cref="SettingParserAttribute"/>] and [<see cref="SettingFormatterAttribute"/>] methods.
    /// </summary>
    /// <remarks>
    /// Marks a class as holding [<see cref="SettingParserAttribute"/>] and [<see cref="SettingFormatterAttribute"/>]
    /// methods. Gears scans every loaded assembly for classes with this attribute at <c>GameAwake</c>. The
    /// class name has no <c>Attribute</c> suffix; write <c>[SettingsSerializationProvider]</c>. See C# Custom
    /// Value Types.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class SettingsSerializationProvider : Attribute
    {
    }
}
