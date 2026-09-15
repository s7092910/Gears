using GearsAPI.Settings.Global;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    public interface IValueModSettingBase : IModSetting
    {
        void SetSettingValueFromString(string raw);
        void SetDefaultValueFromString(string raw);
        void SetSelectedValueFromString(string raw);

        string GetUiFormattedSettingValue();

        string GetFormattedSelectedValue();

        string GetSerializedFormattedSettingValue();
    }
}
