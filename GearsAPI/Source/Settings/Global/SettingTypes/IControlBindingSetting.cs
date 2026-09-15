using InControl;

namespace GearsAPI.Settings.Global
{
    public interface IControlBindingSetting : IGlobalModSetting
    {
        PlayerAction PlayerAction { get; set; }

        void ClearBinding();

    }
}
