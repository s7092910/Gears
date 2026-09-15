using System.Collections.Generic;

namespace GearsAPI.Settings.Global
{
    public interface IGlobalModSettingsTab
    {
        string Name { get; }

        string DisplayKey { get; }

        string TooltipKey { get; set; }

        IGlobalModSettingsCategory GetCategory(string categoryName);

        IGlobalModSettingsCategory CreateCategory(string categoryName, string displayName);

        IGlobalModSettingsCategory GetOrCreateCategory(string categoryName, string displayName);

        bool AddCategory(IGlobalModSettingsCategory category);

        bool RemoveCategory(string categoryName);

        bool RemoveCategory(IGlobalModSettingsCategory category);

        List<IGlobalModSettingsCategory> GetAllCategories();

        List<IGlobalModSetting> GetAllModSettings();

        bool HasToolTip();

        string GetToolTipText();

        string GetDisplayName();

    }
}
