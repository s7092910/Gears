
using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global setting chosen from a list of allowed values.
    /// </summary>
    /// <remarks>
    /// A global setting chosen from a list of allowed values. Implemented for <c>int</c>, <c>float</c>,
    /// <c>string</c> and any enum. An enum selector starts with every declared member as its allowed
    /// values.
    /// </remarks>
    /// <typeparam name="T"><c>int</c>, <c>float</c>, <c>string</c> or an enum.</typeparam>
    public interface ISelectorGlobalSetting<T> : IGlobalValueSetting<T>, ISelectorSettingBase
    {
        /// <summary>
        /// Replaces the allowed values with <paramref name="values"/>, in that order.
        /// </summary>
        void SetAllowedValues(T[] values);

        /// <summary>
        /// Replaces the allowed values with <paramref name="min"/>, <c>min + increment</c>, … up to and
        /// including <paramref name="max"/>. <paramref name="increment"/> must be greater than 0 and
        /// <paramref name="min"/> no greater than <paramref name="max"/>, or the call is logged and
        /// ignored. Logged and ignored on a non-numeric <typeparamref name="T"/>.
        /// </summary>
        void SetAllowedValues(T increment, T min, T max);

        /// <summary>
        /// The values themselves, in the order they are selected through. The matching entry in
        /// <see cref="ISelectorSettingBase.GetAllowedValuesDisplay"/> is how each one is rendered.
        /// </summary>
        T[] GetAllowedValues();

    }
}
