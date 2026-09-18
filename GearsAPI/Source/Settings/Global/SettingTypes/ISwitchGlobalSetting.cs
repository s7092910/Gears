using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global two-position setting.
    /// </summary>
    /// <remarks>
    /// A global two-position setting. Implemented for <c>bool</c> (left <c>false</c>, right <c>true</c>),
    /// <c>string</c> (no sides until <c>SetSwitchValues</c>) and any enum (left and right are the first
    /// two declared members).
    /// </remarks>
    /// <typeparam name="T"><c>bool</c>, <c>string</c> or an enum.</typeparam>
    public interface ISwitchGlobalSetting<T> : IGlobalValueSetting<T>, ISwitchSettingBase
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
