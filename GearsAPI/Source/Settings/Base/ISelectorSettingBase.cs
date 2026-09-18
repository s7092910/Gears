using GearsAPI.Settings;

namespace GearsAPI.Settings.Base
{
    /// <summary>
    /// The non-generic members of a Selector: display, storage and selection by position.
    /// </summary>
    /// <remarks>
    /// The non-generic members of a Selector: how its values are displayed and stored, and selection by
    /// position.
    /// </remarks>
    public interface ISelectorSettingBase : IValueModSettingBase
    {
        /// <summary>
        /// Gets or sets the .NET format string used when a value is shown to the player. Honoured by
        /// numeric types only. Changing it rebuilds the display strings.
        /// </summary>
        string UiFormatter { get; set; }

        /// <summary>
        /// Gets or sets the .NET format string used when the value is saved or read by
        /// <c>modsetting()</c>. Numeric types only.
        /// </summary>
        string SerializationFormatter { get; set; }

        /// <summary>
        /// Gets or sets the text prepended to each formatted value, with no separator, before it is
        /// looked up as a localization key. Changing it rebuilds the display strings.
        /// </summary>
        string LocalizationPrefix { get; set; }

        /// <summary>
        /// Gets or sets whether stepping past the last value returns to the first.
        /// </summary>
        bool Wrap { get; set; }

        /// <summary>
        /// Returns the allowed values as the player sees them, in the same order as the typed
        /// <c>GetAllowedValues()</c>. Built on first use and cached until the values, formatter or
        /// prefix change.
        /// </summary>
        string[] GetAllowedValuesDisplay();

        /// <summary>
        /// Sets the selected value to the allowed value at <paramref name="index"/>. Throws
        /// <c>ArgumentOutOfRangeException</c> if <paramref name="index"/> is outside the allowed values.
        /// </summary>
        void SelectByIndex(int index);
    }
}
