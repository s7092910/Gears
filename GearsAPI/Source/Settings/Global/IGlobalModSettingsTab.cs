using System.Collections.Generic;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A tab in the mod's settings page. A tab is not a setting.
    /// </summary>
    /// <remarks>
    /// A tab in the mod's settings page. A tab is not a setting: it has a tooltip rather than a caption
    /// and description, and no preview or restart scope.
    /// </remarks>
    public interface IGlobalModSettingsTab
    {
        /// <summary>
        /// Gets the tab's identity within the mod.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Gets the localization key for the tab label. Falls back to <c>Name</c>.
        /// </summary>
        string DisplayKey { get; }

        /// <summary>
        /// Gets or sets the localization key for the hover text.
        /// </summary>
        string TooltipKey { get; set; }

        /// <summary>
        /// Returns the <see cref="IGlobalModSettingsCategory"/> named <paramref name="categoryName"/>, or
        /// <c>null</c>.
        /// </summary>
        IGlobalModSettingsCategory GetCategory(string categoryName);

        /// <summary>
        /// Creates a category with the given name and display key. Throws <c>ArgumentException</c> on a
        /// duplicate name.
        /// </summary>
        IGlobalModSettingsCategory CreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Returns the existing category, or creates it.
        /// </summary>
        IGlobalModSettingsCategory GetOrCreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Adds an existing category object. Returns <c>false</c> if the name is taken.
        /// </summary>
        bool AddCategory(IGlobalModSettingsCategory category);

        /// <summary>
        /// Removes the category with that name. Returns whether one was removed.
        /// </summary>
        bool RemoveCategory(string categoryName);

        /// <summary>
        /// Removes that category. Returns whether it was removed.
        /// </summary>
        bool RemoveCategory(IGlobalModSettingsCategory category);

        /// <summary>
        /// Returns every category as a <c>List&lt;IGlobalModSettingsCategory&gt;</c>.
        /// </summary>
        List<IGlobalModSettingsCategory> GetAllCategories();

        /// <summary>
        /// Returns every setting in every category of this tab, categories included, as a
        /// <c>List&lt;IGlobalModSetting&gt;</c>.
        /// </summary>
        List<IGlobalModSetting> GetAllModSettings();

        /// <summary>
        /// Returns <c>true</c> if <c>TooltipKey</c> is set.
        /// </summary>
        bool HasToolTip();

        /// <summary>
        /// Returns the localized tooltip.
        /// </summary>
        string GetToolTipText();

        /// <summary>
        /// Returns the localized tab label.
        /// </summary>
        string GetDisplayName();

    }
}
