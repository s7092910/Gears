using System;

namespace GearsAPI.Attributes
{
    /// <summary>
    /// Base for any attribute that names a setting by its path. The path is
    /// "tabName.CategoryName.SettingName" for global settings and "CategoryName.SettingName" for
    /// world settings.
    /// </summary>
    /// <remarks>
    /// This class deliberately declares no <see cref="AttributeUsage"/>. AttributeUsage is inherited
    /// by derived attribute classes, so every concrete attribute below this one must declare its own.
    /// </remarks>
    public abstract class SettingPathAttribute : Attribute
    {
        public string SettingPath { get; }

        protected SettingPathAttribute(string settingPath)
        {
            if (string.IsNullOrWhiteSpace(settingPath))
                throw new ArgumentException("Setting path cannot be null or empty.", nameof(settingPath));

            SettingPath = settingPath;
        }
    }
}
