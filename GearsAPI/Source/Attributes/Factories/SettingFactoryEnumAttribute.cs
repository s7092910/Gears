using GearsAPI.Settings.Global;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Attributes
{
    [AttributeUsage(AttributeTargets.Class)]
    public sealed class SettingFactoryEnumAttribute : Attribute
    {
        public Type FamilyInterface { get; } // e.g. typeof(ISelectorGlobalSetting<>)

        public SettingFactoryEnumAttribute(Type familyInterface)
        {
            FamilyInterface = familyInterface;
        }
    }
}
