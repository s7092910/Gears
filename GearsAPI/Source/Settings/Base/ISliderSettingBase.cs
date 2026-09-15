using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    public interface ISliderSettingBase : IValueModSettingBase
    {
        string UiFormatter { get; set; }

        string SerializationFormatter { get; set; }
    }
}
