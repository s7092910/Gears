using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a static method as the parser for a value type.
    /// </summary>
    /// <remarks>
    /// Marks a static method inside a [<see cref="SettingsSerializationProvider"/>] class as the parser
    /// for a value type. The method must have the signature <c>static T Method(string)</c>; a mismatch
    /// throws <c>InvalidOperationException</c> when Gears scans it.
    /// </remarks>
    /// <note>
    /// Declared in <c>SettingsParserAttribute.cs</c> — the file name carries an extra <c>s</c> that the
    /// type name does not.
    /// </note>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class SettingParserAttribute : Attribute
    {
        /// <summary>
        /// Gets the type the method parses.
        /// </summary>
        public Type ValueType { get; }

        /// <summary>
        /// Initializes the attribute for <paramref name="valueType"/>.
        /// </summary>
        public SettingParserAttribute(Type valueType)
        {
            ValueType = valueType;
        }
    }
}
