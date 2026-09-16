using GearsAPI.Settings.World;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings
{
    public interface IModSetting
    {
        string Name { get; }

        string DisplayKey { get; }

        string CaptionKey { get; set; }

        string DescriptionKey { get; set; }

        bool Enabled { get; set; }

        event OnSettingEnabledEvent OnEnabled;

        bool IsChanged { get; }

        bool IsDefault { get; }

        string GetDisplayName();

        bool HasCaption();

        string GetCaptionText();

        bool HasDescription();

        string GetDescriptionText();

        bool HasPreviews();

        string GetCurrentPreview();

        void AddPreview(string path);

        void ResetToDefault();

        void DiscardCurrentChange();

        void ApplyCurrentChange();

        /// <summary>
        /// Refreshes the UI for this setting if it is currently being displayed to the user
        /// </summary>
        void RefreshUI();

    }

    public delegate void OnSettingEnabledEvent(IModSetting setting, bool isEnabled);
}
