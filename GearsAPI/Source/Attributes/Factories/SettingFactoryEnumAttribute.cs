using GearsAPI.Settings.Global;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Registers a setting family implementation for every enum.
    /// </summary>
    /// <remarks>
    /// Registers an open generic class with one type parameter as the implementation of a setting
    /// family for every enum.
    /// </remarks>
    /// <reserved/>
    [AttributeUsage(AttributeTargets.Class)]
    public sealed class SettingFactoryEnumAttribute : Attribute
    {
        /// <summary>
        /// Gets the open generic setting interface.
        /// </summary>
        public Type FamilyInterface { get; } // e.g. typeof(ISelectorGlobalSetting<>)

        /// <summary>
        /// Initializes the attribute with the open generic family interface.
        /// </summary>
        public SettingFactoryEnumAttribute(Type familyInterface)
        {
            FamilyInterface = familyInterface;
        }
    }
}
