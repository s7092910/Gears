using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a static method as the formatter for a value type.
    /// Method must match: static string MethodName(T, string)
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class SettingFormatterAttribute : Attribute
    {
        public Type ValueType { get; }

        public SettingFormatterAttribute(Type valueType)
        {
            ValueType = valueType;
        }
    }
}
