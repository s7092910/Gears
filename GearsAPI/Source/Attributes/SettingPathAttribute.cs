using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Base for any attribute that names a setting by its path. The path is
    /// "tabName.CategoryName.SettingName" for global settings and "CategoryName.SettingName" for
    /// world settings.
    /// </summary>
    /// <remarks>
    /// Base class of every attribute that names a setting by its path for <c>BindSettingsClass</c>.
    /// Cannot be applied directly. This class deliberately declares no <see cref="AttributeUsage"/> of
    /// its own, because <c>AttributeUsage</c> is inherited — each concrete attribute below it declares
    /// its own targets.
    /// </remarks>
    public abstract class SettingPathAttribute : Attribute
    {
        /// <summary>
        /// Gets the dot-separated path to the setting: <c>"Tab.Category.Setting"</c> for global settings,
        /// <c>"Category.Setting"</c> for world settings.
        /// </summary>
        public string SettingPath { get; }

        /// <summary>
        /// Protected. Stores <paramref name="settingPath"/>. Throws <c>ArgumentException</c> if it is
        /// <c>null</c> or whitespace.
        /// </summary>
        protected SettingPathAttribute(string settingPath)
        {
            if (string.IsNullOrWhiteSpace(settingPath))
                throw new ArgumentException("Setting path cannot be null or empty.", nameof(settingPath));

            SettingPath = settingPath;
        }
    }
}
