using GearsAPI.Settings.Global;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Base
{
    /// <summary>
    /// The non-generic face of a value setting: string in, string out.
    /// </summary>
    /// <remarks>
    /// The non-generic face of a value setting, for code that handles settings without knowing their
    /// value type: string in, string out, through the type's registered parser and formatter.
    /// </remarks>
    public interface IValueModSettingBase : IModSetting
    {
        /// <summary>
        /// Parses <paramref name="raw"/> with the value type's parser and assigns the applied value. An
        /// unparseable string is logged and the value is left unchanged.
        /// </summary>
        void SetSettingValueFromString(string raw);
        /// <summary>
        /// Parses <paramref name="raw"/> and assigns the default value. Same failure handling.
        /// </summary>
        void SetDefaultValueFromString(string raw);
        /// <summary>
        /// Parses <paramref name="raw"/> and assigns the selected value. Same failure handling.
        /// </summary>
        void SetSelectedValueFromString(string raw);

        /// <summary>
        /// Returns the applied value as the player sees it: formatted with the UI formatter, prefixed
        /// with the localization prefix and passed through <c>Localization.Get</c>.
        /// </summary>
        string GetUiFormattedSettingValue();

        /// <summary>
        /// Returns the selected value as the player sees it.
        /// </summary>
        string GetFormattedSelectedValue();

        /// <summary>
        /// Returns the applied value as written to the saved settings file and returned by
        /// <c>modsetting()</c>: formatted with the serialization formatter, no localization.
        /// </summary>
        string GetSerializedFormattedSettingValue();
    }
}
