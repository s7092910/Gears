
using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.Global
{
    public interface ISliderGlobalSetting<T> : IGlobalValueSetting<T>, ISliderSettingBase where T : struct
    {
        T Increment { get; }
        T Min { get; }
        T Max { get; }

        void SetAllowedValues(T increment, T min, T max);

    }
}
