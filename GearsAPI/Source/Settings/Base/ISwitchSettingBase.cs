using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    /// <summary>
    /// The non-generic members of a Switch: the two buttons, their text, and which one is lit.
    /// </summary>
    /// <remarks>
    /// The non-generic members of a Switch: the two buttons, their text, and which one is lit.
    /// </remarks>
    public interface ISwitchSettingBase : IValueModSettingBase
    {
        /// <summary>
        /// Gets or sets the text prepended to each side's formatted value, with no separator, before it
        /// is looked up as a localization key.
        /// </summary>
        string LocalizationPrefix { get; set; }

        /// <summary>
        /// Returns the localized text for the right value.
        /// </summary>
        string GetRightText();
        /// <summary>
        /// Returns the localized text for the left value.
        /// </summary>
        string GetLeftText();

        /// <summary>
        /// Sets the selected value to the value on that side.
        /// </summary>
        void SelectButton(SelectedButton button);

        /// <summary>
        /// Returns <see cref="SelectedButton.Right"/> when the selected value equals the right value and
        /// not the left value; otherwise <c>Left</c>. Derived from the value on every call.
        /// </summary>
        SelectedButton GetSelectedButton();

        /// <summary>
        /// Which side of a Switch is lit.
        /// </summary>
        /// <remarks>
        /// Which side of a Switch is lit. Nested in <see cref="ISwitchSettingBase"/>; write
        /// <c>ISwitchSettingBase.SelectedButton.Left</c> or add
        /// <c>using static GearsAPI.Settings.Base.ISwitchSettingBase;</c>.
        /// </remarks>
        /// <note>
        /// Declared inside the interface without an explicit <c>public</c> modifier — nested interface
        /// types are implicitly public.
        /// </note>
        enum SelectedButton
        {
            /// <summary>
            /// The right button, holding <c>RightValue</c>. For a <c>bool</c> switch, <c>true</c>.
            /// </summary>
            Right = 0,
            /// <summary>
            /// The left button, holding <c>LeftValue</c>. For a <c>bool</c> switch, <c>false</c>. Also
            /// the resting position when the selected value matches neither side.
            /// </summary>
            Left = 1

        }
    }
}
