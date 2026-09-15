using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    public interface ISelectorWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISelectorSettingBase
    {

        void SetAllowedValues(T[] values);

        void SetAllowedValues(T increment, T min, T max);

        /// <summary>
        /// The values themselves, in the order they are selected through. The matching entry in
        /// <see cref="ISelectorSettingBase.GetAllowedValuesDisplay"/> is how each one is rendered.
        /// </summary>
        T[] GetAllowedValues();

    }
}
