using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
    public sealed class SettingFactoryFixedAttribute : Attribute
    {
        public Type KeyInterface { get; } // e.g. typeof(IControlBindingSetting)

        public SettingFactoryFixedAttribute(Type keyInterface)
        {
            KeyInterface = keyInterface;
        }
    }
}
