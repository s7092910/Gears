using GearsAPI.Settings.Base;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// A world setting chosen from a list of allowed values.
    /// </summary>
    /// <remarks>
    /// A world setting chosen from a list of allowed values. Implemented for <c>int</c>, <c>float</c>,
    /// <c>string</c> and any enum. Raises <c>OnSelectedChanged</c> only; there is no <c>OnValueChanged</c>
    /// on world settings.
    /// </remarks>
    /// <typeparam name="T"><c>int</c>, <c>float</c>, <c>string</c> or an enum.</typeparam>
    public interface ISelectorWorldSetting<T> : IWorldModSetting, IValueModSetting<T>, ISelectorSettingBase
    {

        /// <summary>
        /// Replaces the allowed values with <paramref name="values"/>, in that order.
        /// </summary>
        void SetAllowedValues(T[] values);

        /// <summary>
        /// Replaces the allowed values with the range <paramref name="min"/> to <paramref name="max"/>
        /// in steps of <paramref name="increment"/>. Same validation as the global version.
        /// </summary>
        void SetAllowedValues(T increment, T min, T max);

        /// <summary>
        /// The values themselves, in the order they are selected through. The matching entry in
        /// <see cref="ISelectorSettingBase.GetAllowedValuesDisplay"/> is how each one is rendered.
        /// </summary>
        T[] GetAllowedValues();

    }
}
