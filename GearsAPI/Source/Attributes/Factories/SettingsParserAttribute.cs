using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Marks a static method as the parser for a value type.
    /// Method must match: static T MethodName(string)
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class SettingParserAttribute : Attribute
    {
        public Type ValueType { get; }

        public SettingParserAttribute(Type valueType)
        {
            ValueType = valueType;
        }
    }
}
