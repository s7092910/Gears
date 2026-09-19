using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a static method as the formatter for a value type.
    /// </summary>
    /// <remarks>
    /// Marks a static method inside a <see cref="SettingsSerializationProvider"/> class as the formatter
    /// for a value type. The method must have the signature <c>static string Method(T value, string format)</c>,
    /// where <c>format</c> is the setting's UI or serialization formatter string and may be <c>null</c>; a
    /// mismatch throws <c>InvalidOperationException</c> when Gears scans it.
    /// One formatter is registered per value type across the whole game, and the last one scanned
    /// wins. Registering a type Gears already handles replaces its handler, and two mods registering
    /// the same type silently overwrite each other, so register only types your own mod owns.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class SettingFormatterAttribute : Attribute
    {
        /// <summary>
        /// Gets the type the method formats.
        /// </summary>
        public Type ValueType { get; }

        /// <summary>
        /// Initializes the attribute for <paramref name="valueType"/>.
        /// </summary>
        public SettingFormatterAttribute(Type valueType)
        {
            ValueType = valueType;
        }
    }
}
