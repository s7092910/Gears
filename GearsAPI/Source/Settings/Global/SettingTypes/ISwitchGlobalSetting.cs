using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.Global
{
    public interface ISwitchGlobalSetting<T> : IGlobalValueSetting<T>, ISwitchSettingBase
    {
        T LeftValue { get; set; }

        T RightValue { get; set; }

        void SetSwitchValues(T leftValue, T rightValue);
    }
}
