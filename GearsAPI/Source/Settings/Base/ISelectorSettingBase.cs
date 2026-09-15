using GearsAPI.Settings;

namespace GearsAPI.Settings.Base
{
    public interface ISelectorSettingBase : IValueModSettingBase
    {
        string UiFormatter { get; set; }

        string SerializationFormatter { get; set; }

        string LocalizationPrefix { get; set; }

        bool Wrap { get; set; }

        string[] GetAllowedValuesDisplay();

        void SelectByIndex(int index);
    }
}
