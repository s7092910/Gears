using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public sealed class SettingFactoryAttribute : Attribute
    {
        public Type FamilyInterface { get; }
        public Type ValueType { get; }

        public SettingFactoryAttribute(Type familyInterface, Type valueType)
        {
            FamilyInterface = familyInterface;
            ValueType = valueType;
        }
    }
}
