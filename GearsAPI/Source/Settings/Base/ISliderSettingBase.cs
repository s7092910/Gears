using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    /// <summary>
    /// The non-generic members of a Slider.
    /// </summary>
    /// <remarks>
    /// The non-generic members of a Slider.
    /// </remarks>
    public interface ISliderSettingBase : IValueModSettingBase
    {
        /// <summary>
        /// Gets or sets the .NET format string used when the value is shown to the player.
        /// </summary>
        string UiFormatter { get; set; }

        /// <summary>
        /// Gets or sets the .NET format string used when the value is saved or read by
        /// <c>modsetting()</c>.
        /// </summary>
        string SerializationFormatter { get; set; }
    }
}
