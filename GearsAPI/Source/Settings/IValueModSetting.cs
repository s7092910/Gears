using GearsAPI.Settings.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings
{
    /// <summary>
    /// A setting that holds a value of type <c>T</c>: the default, the applied value and the selected value.
    /// </summary>
    /// <remarks>
    /// A setting that holds a value of type <c>T</c>: the default, the applied value and the value currently
    /// selected in the UI. Implemented by every Selector, Slider, Switch and Color setting.
    /// </remarks>
    /// <typeparam name="T">the value type; <c>int</c>, <c>float</c>, <c>string</c>, <c>bool</c>, <c>UnityEngine.Color</c> or an enum.</typeparam>
    public interface IValueModSetting<T> : IValueModSettingBase
    {
        /// <summary>
        /// Occurs when <c>SelectedValue</c> changes to a different value. Type <see cref="OnSelectedChangedEvent{T}"/>.
        /// </summary>
        /// <remarks>
        /// Not raised while Gears loads values in from XML - restoring saved global values, or a
        /// world's values arriving. Loading a value in is not a change to report; use
        /// <c>SyncSettingsToClass</c> to be handed the loaded values deliberately.
        /// </remarks>
        event OnSelectedChangedEvent<T> OnSelectedChanged;

        /// <summary>
        /// Gets or sets the applied value: what is saved to disk, returned by <c>modsetting()</c>, and what a mod should act on.
        /// </summary>
        T SettingValue { get; set; }

        /// <summary>
        /// Gets or sets the value <c>ResetToDefault()</c> returns to.
        /// </summary>
        T DefaultValue { get; set; }

        /// <summary>
        /// Gets or sets the value currently selected in the UI, possibly not yet applied.
        /// </summary>
        T SelectedValue { get; set; }

        /// <summary>
        /// Returns the preview image path registered for <c>value</c>, or <c>null</c>.
        /// </summary>
        string GetPreview(T value);

        /// <summary>
        /// Registers an image to show while <c>value</c> is selected. The first image registered for a value wins.
        /// </summary>
        void AddPreview(T value, string path);

    }

    /// <summary>
    /// Handler for <c>IValueModSetting&lt;T&gt;.OnSelectedChanged</c>.
    /// </summary>
    /// <remarks>
    /// Handler for <see cref="IValueModSetting{T}.OnSelectedChanged"/>.
    /// </remarks>
    /// <param name="setting">The setting whose selection changed.</param>
    /// <param name="newSelectedValue">The new selected value.</param>
    public delegate void OnSelectedChangedEvent<T>(IValueModSetting<T> setting, T newSelectedValue);
}
