
namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global setting that holds a value of type <typeparamref name="T"/>, with the applied-value
    /// event.
    /// </summary>
    /// <remarks>
    /// A global setting that holds a value of type <typeparamref name="T"/>. Adds the applied-value
    /// event to <see cref="IValueModSetting{T}"/>.
    /// </remarks>
    /// <typeparam name="T">the value type.</typeparam>
    public interface IGlobalValueSetting<T> : IGlobalModSetting, IValueModSetting<T>
    {
        /// <summary>
        /// Occurs when <c>SettingValue</c> changes to a different value: when the player saves, when a
        /// saved value is restored, or when code assigns it. Type <see cref="ValueChangedEvent{T}"/>.
        /// </summary>
        event ValueChangedEvent<T> OnValueChanged;
    }

    //If the Value has been changed
    /// <summary>
    /// Handler for <c>IGlobalValueSetting&lt;T&gt;.OnValueChanged</c>.
    /// </summary>
    /// <remarks>
    /// Handler for <see cref="IGlobalValueSetting{T}.OnValueChanged"/>.
    /// </remarks>
    /// <param name="setting">
    /// The setting whose applied value changed. Note the parameter type is
    /// <c>IValueModSetting&lt;T&gt;</c>, not <c>IGlobalValueSetting&lt;T&gt;</c>; listener methods must
    /// match it exactly.
    /// </param>
    /// <param name="newSelectedValue">The new applied value.</param>
    public delegate void ValueChangedEvent<T>(IValueModSetting<T> setting, T newSelectedValue);
}
