using GearsAPI.Settings.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings
{
    public interface IValueModSetting<T> : IValueModSettingBase
    {
        event ValueSelectedEvent<T> OnSelected;

        //The Setting's Saved Value
        T SettingValue { get; set; }

        //The Default Value of the setting
        T DefaultValue { get; set; }

        //The Selected Value in the UI
        T SelectedValue { get; set; }

        string GetPreview(T value);

        void AddPreview(T value, string path);

    }

    //If the Selected Value has been changed
    public delegate void ValueSelectedEvent<T>(IValueModSetting<T> setting, T newSelectedValue);
}
