using InControl;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global key-binding row. Not a value setting.
    /// </summary>
    /// <remarks>
    /// A global key-binding row. Not a value setting: it has no <c>SettingValue</c>, is not saved by
    /// Gears, and returns an empty string from <c>modsetting()</c>. The mod attaches the game
    /// <c>PlayerAction</c> the row rebinds.
    /// The inherited operations act on that <c>PlayerAction</c> rather than on a stored value.
    /// <c>ResetToDefault()</c> calls <c>PlayerAction.ResetBindings()</c>, <c>DiscardCurrentChange()</c>
    /// puts back the binding recorded when <c>PlayerAction</c> was assigned or last applied, and
    /// <c>ApplyCurrentChange()</c> records the current binding as the new baseline and raises
    /// <c>OnSettingApplied</c>. <c>IsChanged</c> compares the action's binding against that baseline,
    /// and <c>IsDefault</c> is always <c>false</c>.
    /// </remarks>
    public interface IControlBindingSetting : IGlobalModSetting
    {
        /// <summary>
        /// Gets or sets the <c>InControl.PlayerAction</c> this row rebinds. <c>null</c> until the mod assigns it, and the row reads "- Missing PlayerAction -" until then. Assigning it records the action's current binding as the baseline that <c>IsChanged</c> and <c>DiscardCurrentChange()</c> work against, so assign it once the action set exists.
        /// </summary>
        PlayerAction PlayerAction { get; set; }

        /// <summary>
        /// Removes every binding from <c>PlayerAction</c>, which is what the row's clear button does. Does nothing when no <c>PlayerAction</c> has been assigned.
        /// </summary>
        void ClearBinding();

    }
}
