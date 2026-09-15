using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    public interface ISliderWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISliderSettingBase where T : struct
    {
        T Increment { get; }
        T Min { get; }
        T Max { get; }

        void SetAllowedValues(T increment, T min, T max);

    }
}
