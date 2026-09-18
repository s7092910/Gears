using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Registers a setting family implementation for one value type.
    /// </summary>
    /// <remarks>
    /// Registers a class as the implementation of a setting family for one value type, for example
    /// <c>[SettingFactory(typeof(ISelectorGlobalSetting&lt;&gt;), typeof(int))]</c>.
    /// </remarks>
    /// <reserved/>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public sealed class SettingFactoryAttribute : Attribute
    {
        /// <summary>
        /// Gets the open generic setting interface, such as <c>typeof(ISelectorGlobalSetting&lt;&gt;)</c>.
        /// </summary>
        public Type FamilyInterface { get; }

        /// <summary>
        /// Gets the value type the class implements the family for.
        /// </summary>
        public Type ValueType { get; }

        /// <summary>
        /// Initializes the attribute with the open generic family interface and the value type.
        /// </summary>
        public SettingFactoryAttribute(Type familyInterface, Type valueType)
        {
            FamilyInterface = familyInterface;
            ValueType = valueType;
        }
    }
}
