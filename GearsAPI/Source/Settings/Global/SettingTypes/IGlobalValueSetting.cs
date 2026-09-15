
namespace GearsAPI.Settings.Global
{
    public interface IGlobalValueSetting<T> : IGlobalModSetting, IValueModSetting<T>
    {
        event ValueChangedEvent<T> OnValueChanged;
    }

    //If the Value has been changed
    public delegate void ValueChangedEvent<T>(IValueModSetting<T> setting, T newSelectedValue);
}
