using GearsAPI.Settings.World;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings
{
    /// <summary>
    /// The members every setting shares, including categories.
    /// </summary>
    /// <remarks>
    /// The members every setting shares, including categories: identity, display text, enabled state,
    /// the change flags, preview images, and the three operations the settings window performs.
    /// </remarks>
    public interface IModSetting
    {
        /// <summary>
        /// Gets the setting's identity within its category. The <c>name</c> attribute in XML.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Gets the localization key for the label. Falls back to <c>Name</c> when empty.
        /// </summary>
        string DisplayKey { get; }

        /// <summary>
        /// Gets or sets the localization key for the short heading in the description pane.
        /// </summary>
        string CaptionKey { get; set; }

        /// <summary>
        /// Gets or sets the localization key for the description text.
        /// </summary>
        string DescriptionKey { get; set; }

        /// <summary>
        /// Gets or sets whether the setting can be changed in the menu. Starts <c>true</c>.
        /// </summary>
        bool Enabled { get; set; }

        /// <summary>
        /// Occurs when <c>Enabled</c> changes to a different value. Type <see cref="OnSettingEnabledEvent"/>.
        /// </summary>
        event OnSettingEnabledEvent OnEnabled;

        /// <summary>
        /// Gets whether the selected value differs from the applied value.
        /// </summary>
        bool IsChanged { get; }

        /// <summary>
        /// Gets whether the applied value equals the default value.
        /// </summary>
        bool IsDefault { get; }

        /// <summary>
        /// Returns the localized label: <c>Localization.Get(DisplayKey)</c>, or of <c>Name</c> when the key is empty.
        /// </summary>
        string GetDisplayName();

        /// <summary>
        /// Returns <c>true</c> if <c>CaptionKey</c> is set and not whitespace.
        /// </summary>
        bool HasCaption();

        /// <summary>
        /// Returns the localized caption, or the display name when there is no caption.
        /// </summary>
        string GetCaptionText();

        /// <summary>
        /// Returns <c>true</c> if <c>DescriptionKey</c> is set and not whitespace.
        /// </summary>
        bool HasDescription();

        /// <summary>
        /// Returns the localized description.
        /// </summary>
        string GetDescriptionText();

        /// <summary>
        /// Returns <c>true</c> if the setting has any preview image.
        /// </summary>
        bool HasPreviews();

        /// <summary>
        /// Returns the image path for the selected value, or the setting's own image when none is keyed to that value.
        /// </summary>
        string GetCurrentPreview();

        /// <summary>
        /// Sets the setting's own preview image path. The last call wins.
        /// </summary>
        void AddPreview(string path);

        /// <summary>
        /// Sets the selected value to the default value. The applied value is untouched.
        /// </summary>
        void ResetToDefault();

        /// <summary>
        /// Sets the selected value back to the applied value.
        /// </summary>
        void DiscardCurrentChange();

        /// <summary>
        /// Commits the selected value as the applied value, raising <c>OnValueChanged</c> and, on a global setting, <c>OnSettingApplied</c>.
        /// </summary>
        void ApplyCurrentChange();

        /// <summary>
        /// Refreshes the UI for this setting if it is currently being displayed to the user
        /// </summary>
        void RefreshUI();

    }

    /// <summary>
    /// Handler for <c>IModSetting.OnEnabled</c>.
    /// </summary>
    /// <remarks>
    /// Handler for <see cref="IModSetting.OnEnabled"/>. Raised only when <c>Enabled</c> is assigned a value
    /// different from the current one.
    /// </remarks>
    /// <param name="setting">The setting whose enabled state changed.</param>
    /// <param name="isEnabled">The setting's new enabled state.</param>
    public delegate void OnSettingEnabledEvent(IModSetting setting, bool isEnabled);
}
