using UnityEngine;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// A global color picker over <c>UnityEngine.Color</c>.
    /// </summary>
    /// <remarks>
    /// A global color picker. Adds no members of its own; everything comes from
    /// <see cref="IGlobalValueSetting{T}"/> with <c>T</c> = <c>UnityEngine.Color</c>. Serialized as
    /// <c>R,G,B</c> in 0–255. Only the setting's own preview image is shown.
    /// </remarks>
    public interface IColorSelectorGlobalSetting : IGlobalValueSetting<Color>
    {
    }
}
