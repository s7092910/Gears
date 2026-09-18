using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Registers an implementation of a non-generic setting interface.
    /// </summary>
    /// <remarks>
    /// Registers a class as the implementation of a non-generic setting interface such as
    /// <see cref="IColorSelectorGlobalSetting"/> or <see cref="IControlBindingSetting"/>.
    /// </remarks>
    /// <reserved/>
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
    public sealed class SettingFactoryFixedAttribute : Attribute
    {
        /// <summary>
        /// Gets the non-generic setting interface the class implements.
        /// </summary>
        public Type KeyInterface { get; } // e.g. typeof(IControlBindingSetting)

        /// <summary>
        /// Initializes the attribute with the setting interface it implements.
        /// </summary>
        public SettingFactoryFixedAttribute(Type keyInterface)
        {
            KeyInterface = keyInterface;
        }
    }
}
