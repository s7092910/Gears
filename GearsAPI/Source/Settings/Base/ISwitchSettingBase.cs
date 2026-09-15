using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    public interface ISwitchSettingBase : IValueModSettingBase
    {
        string LocalizationPrefix { get; set; }

        string GetRightText();
        string GetLeftText();

        void SelectButton(SelectedButton button);

        SelectedButton GetSelectedButton();

        enum SelectedButton
        {
            Right = 0,
            Left = 1

        }
    }
}
