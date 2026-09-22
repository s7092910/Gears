
using System;
using System.Collections.Generic;

namespace GearsAPI.Settings.World
{
    /// <summary>
    /// The root of a mod's world settings. No tab level; categories sit directly here.
    /// </summary>
    /// <remarks>
    /// The root of a mod's world settings. There is no tab level; categories sit directly here. Handed
    /// to <see cref="IGearsModApi.OnWorldSettingsLoaded"/>; also <see cref="IGearsMod.WorldSettings"/>.
    /// </remarks>
    public interface IModWorldSettings
    {
        /// <summary>
        /// Returns the <see cref="IWorldModSettingsCategory"/> named <paramref name="categoryName"/>, or <c>null</c>.
        /// </summary>
        IWorldModSettingsCategory GetCategory(string categoryName);

        /// <summary>
        /// Creates a category with the given name and display key. Throws <c>ArgumentException</c> on a duplicate name.
        /// </summary>
        IWorldModSettingsCategory CreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Returns the existing category, or creates it.
        /// </summary>
        IWorldModSettingsCategory GetOrCreateCategory(string categoryName, string displayName);

        /// <summary>
        /// Adds an existing category object. Returns <c>false</c> if the name is taken.
        /// </summary>
        bool AddCategory(IWorldModSettingsCategory category);

        /// <summary>
        /// Removes the category with that name. Returns whether one was removed.
        /// </summary>
        bool RemoveCategory(string categoryName);

        /// <summary>
        /// Removes that category. Returns whether it was removed.
        /// </summary>
        bool RemoveCategory(IWorldModSettingsCategory category);

        /// <summary>
        /// Returns every category as a <c>List&lt;IWorldModSettingsCategory&gt;</c>.
        /// </summary>
        List<IWorldModSettingsCategory> GetAllCategories();

        /// <summary>
        /// Returns every setting in every category, categories included, as a <c>List&lt;IWorldModSetting&gt;</c>.
        /// </summary>
        List<IWorldModSetting> GetAllWorldSettings();

        /// <summary>
        /// Binds a settings class. A type is bound once; later calls for it do nothing.
        /// </summary>
        /// <remarks>
        /// Scans <paramref name="settingsType"/> for tagged static members carrying a <c>"Category.Setting"</c>
        /// path. Fields and properties tagged <see cref="SettingAttribute"/> are assigned the named setting
        /// first, then methods tagged <see cref="SettingOnSelectedChangedAttribute"/> or
        /// <see cref="SettingOnEnabledAttribute"/> are subscribed.
        /// <para>
        /// A world setting raises no OnValueChanged, because its applied value arrives with the world
        /// rather than changing under the player. A method tagged
        /// <see cref="SettingOnValueChangedAttribute"/> is therefore bound <b>invoke-only</b>: it is
        /// never raised, and runs only when <see cref="SyncSettingsToClass"/> calls it — which
        /// means it must be written with <c>includeInSync: true</c>, or it can never run at all.
        /// <see cref="SettingOnAppliedAttribute"/> has no such fallback and is logged and skipped.
        /// </para>
        /// <para>
        /// <b>Call this from <c>IGearsModApi.InitMod</c>.</b> <c>ModSettings.xml</c> is read before
        /// that callback, so every setting exists by then, and it runs exactly once - whereas
        /// <c>OnWorldSettingsLoaded</c> fires again on every world load and rejoin. Binding is a
        /// one-time wiring job; use <see cref="SyncSettingsToClass"/> in the callback for the part
        /// that repeats.
        /// </para>
        /// <para>
        /// This binds and nothing else. No listener is called, whether or not it asked for
        /// <c>IncludeInSync</c>. Calling this again with a type already bound does nothing at all,
        /// so binding from <c>OnWorldSettingsLoaded</c> instead is safe - just harder to follow.
        /// </para>
        /// Throws <c>ArgumentNullException</c> for <c>null</c>.
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
        /// This is how a mod picks up a new world's values, and it is the only thing that calls a
        /// listener with a value no event delivered. <see cref="BindSettingsClass"/> deliberately
        /// calls nothing, so pairing the two runs each listener exactly once per world load. Gears
        /// applies a world's values before it fires <c>OnWorldSettingsLoaded</c>, so calling this from
        /// that callback hands every listener the current world's values, on the first load and on
        /// every load after it.
        /// </para>
        /// <para>
        /// A listener without <c>IncludeInSync</c> is skipped — it runs only when its event fires.
        /// Throws <c>ArgumentNullException</c> for <c>null</c>, and logs a type that has never been
        /// bound rather than doing anything.
        /// </para>
        /// <para>
        /// When <c>OnWorldSettingsLoaded</c> returns, Gears warns about every bound class that has an
        /// <c>includeInSync</c> listener and was not passed to this method during that callback. The
        /// check runs on every world load, so a load that skips the sync is reported even when an
        /// earlier one did it. A class with no <c>includeInSync</c> listener is never reported.
        /// </para>
        /// </remarks>
        void SyncSettingsToClass(Type settingsType);

        /// <summary>
        /// Writes the player-level saved settings file. World values themselves are written to the save
        /// folder by the world settings screen and on world start, not by this call.
        /// </summary>
        void SaveSettings();
    }
}
