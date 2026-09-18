using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// A world numeric setting within a range. <c>int</c> and <c>float</c> only.
    /// </summary>
    /// <remarks>
    /// A world numeric setting within a range. Implemented for <c>int</c> and <c>float</c> only.
    /// </remarks>
    /// <typeparam name="T"><c>int</c> or <c>float</c>.</typeparam>
    public interface ISliderWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISliderSettingBase where T : struct
    {
        /// <summary>
        /// Gets the step between values.
        /// </summary>
        T Increment { get; }

        /// <summary>
        /// Gets the lowest value.
        /// </summary>
        T Min { get; }

        /// <summary>
        /// Gets the highest value.
        /// </summary>
        T Max { get; }

        /// <summary>
        /// Sets <c>Increment</c>, <c>Min</c> and <c>Max</c>.
        /// </summary>
        void SetAllowedValues(T increment, T min, T max);

    }
}
