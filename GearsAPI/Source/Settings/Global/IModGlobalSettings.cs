using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GearsAPI.Settings.Global
{
    /// <summary>
    /// The root of a mod's global settings: the tabs, and operations across the whole tree.
    /// </summary>
    /// <remarks>
    /// The root of a mod's global settings: the tabs, and operations across the whole tree. Handed to
    /// <see cref="IGearsModApi.OnGlobalSettingsLoaded"/>; also <see cref="IGearsMod.GlobalSettings"/>.
    /// </remarks>
    public interface IModGlobalSettings
    {
        /// <summary>
        /// Returns the <see cref="IGlobalModSettingsTab"/> named <paramref name="name"/>, or <c>null</c>.
        /// </summary>
        IGlobalModSettingsTab GetTab(string name);

        /// <summary>
        /// Creates a tab whose display key is its name. Throws <c>ArgumentException</c> if a tab with
        /// that name exists.
        /// </summary>
        IGlobalModSettingsTab CreateTab(string name);

        /// <summary>
        /// Creates a tab with the given name and display key. Throws <c>ArgumentException</c> on a
        /// duplicate name.
        /// </summary>
        IGlobalModSettingsTab CreateTab(string name, string displayNameKey);

        /// <summary>
        /// Returns the existing tab named <paramref name="name"/>, or creates it with its name as
        /// display key.
        /// </summary>
        IGlobalModSettingsTab GetOrCreateTab(string name);

        /// <summary>
        /// Returns the existing tab named <paramref name="name"/>, or creates it with the given display
        /// key.
        /// </summary>
        IGlobalModSettingsTab GetOrCreateTab(string name, string displayNameKey);

        /// <summary>
        /// Returns every tab as a <c>List&lt;IGlobalModSettingsTab&gt;</c>.
        /// </summary>
        List<IGlobalModSettingsTab> GetTabs();

        /// <summary>
        /// Returns every setting in every category of every tab, categories included, as a
        /// <c>List&lt;IGlobalModSetting&gt;</c>.
        /// </summary>
        List<IGlobalModSetting> GetAllGlobalSettings();

        /// <summary>
        /// Binds a settings class. A type is bound once; later calls for it do nothing.
        /// </summary>
        /// <remarks>
        /// Scans <paramref name="settingsType"/> for tagged static members carrying a
        /// <c>"Tab.Category.Setting"</c> path. Fields and properties tagged <see cref="SettingAttribute"/>
        /// are assigned the named setting first, then methods tagged
        /// <see cref="SettingOnValueChangedAttribute"/>, <see cref="SettingOnSelectedChangedAttribute"/>,
        /// <see cref="SettingOnAppliedAttribute"/> or <see cref="SettingOnEnabledAttribute"/> are
        /// subscribed.
        /// <para>
        /// <b>Call this from <c>IGearsModApi.InitMod</c>.</b> <c>ModSettings.xml</c> is read before
        /// that callback, so every setting exists by then, and one <c>InitMod</c> can bind the world
        /// class too. Binding is a one-time wiring job; use <see cref="SyncSettingsToClass"/> in
        /// <c>OnGlobalSettingsLoaded</c> for the values.
        /// </para>
        /// <para>
        /// This binds and nothing else. No listener is called, whether or not it asked for
        /// <c>IncludeInSync</c>. Calling this again with a type already bound does nothing at all,
        /// so binding from <c>OnGlobalSettingsLoaded</c> instead is safe - just harder to follow.
        /// </para>
        /// Throws <c>ArgumentNullException</c> for <c>null</c>; every other problem is logged
        /// and that one member skipped. See the Bind Settings with Attributes guide.
        /// </remarks>
        void BindSettingsClass(Type settingsType);

        /// <summary>
        /// Calls the opted-in value listeners on an already-bound class with the values their settings
        /// hold now.
        /// </summary>
        /// <remarks>
        /// Calls every method on <paramref name="settingsType"/> tagged
        /// <see cref="SettingOnValueChangedAttribute"/> or <see cref="SettingOnSelectedChangedAttribute"/>
        /// <b>with <c>includeInSync: true</c></b>, handing each the value its setting holds at that
        /// moment, exactly as if the event had fired. Nothing is bound or subscribed, so this is safe
        /// to call as often as you like.
        /// <para>
        /// Call it from <c>OnGlobalSettingsLoaded</c>, where the player's saved values are final, with
        /// the <see cref="BindSettingsClass"/> done earlier in <c>InitMod</c>. That starts a mod off in
        /// step with what is saved, rather than waiting for the first change.
        /// </para>
        /// <para>
        /// A listener without <c>IncludeInSync</c> is skipped — it runs only when its event fires.
        /// Throws <c>ArgumentNullException</c> for <c>null</c>, and logs a type that has never been
        /// bound rather than doing anything.
        /// </para>
        /// <para>
        /// When <c>OnGlobalSettingsLoaded</c> returns, Gears warns about every bound class that has an
        /// <c>includeInSync</c> listener and was not passed to this method during that callback. A
        /// class with no <c>includeInSync</c> listener is never reported.
        /// </para>
        /// </remarks>
        void SyncSettingsToClass(Type settingsType);

        /// <summary>
        /// Writes the player-level saved settings file now.
        /// </summary>
        void SaveSettings();

    }
}
