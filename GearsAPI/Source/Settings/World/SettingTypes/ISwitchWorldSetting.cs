using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    public interface ISwitchWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISwitchSettingBase
    {
        T LeftValue { get; set; }

        T RightValue { get; set; }

        void SetSwitchValues(T leftValue, T rightValue);
    }
}
