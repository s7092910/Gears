using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// A world two-position setting.
    /// </summary>
    /// <remarks>
    /// A world two-position setting. Implemented for <c>bool</c>, <c>string</c> and any enum, with the
    /// same side defaults as the global version.
    /// </remarks>
    /// <typeparam name="T"><c>bool</c>, <c>string</c> or an enum.</typeparam>
    public interface ISwitchWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISwitchSettingBase
    {
        /// <summary>
        /// Gets or sets the value the left button selects.
        /// </summary>
        T LeftValue { get; set; }

        /// <summary>
        /// Gets or sets the value the right button selects.
        /// </summary>
        T RightValue { get; set; }

        /// <summary>
        /// Sets <c>LeftValue</c> and <c>RightValue</c> together.
        /// </summary>
        void SetSwitchValues(T leftValue, T rightValue);
    }
}
