# Changelog

High-level summary of what changed for mod authors between GearsAPI 2.0 (Gears 7.0.0) and
GearsAPI 3.0 (Gears 8.0.0). This is an API and schema changelog, not a bug-fix log — see
[Upgrading to GearsAPI 3](Docs/Upgrading-to-GearsAPI-3.md) for the mechanical, step-by-step
conversion guide.

## GearsAPI 3.0 / Gears 8.0.0

### `ModSettings.xml`: new V2 schema

The old attribute-driven V1 schema is no longer read. `ModSettings.xml` must now declare
`version="2"`, and the format has moved from attributes to named child elements throughout.

- **Typed settings.** A setting's value type is now stated explicitly with a `type` attribute
  (`int`, `float`, `string`, `bool`, `Color`, or the name of a mod-supplied enum) instead of being
  inferred from which XML attribute happened to be used.
- **`defaultValue` replaces `value`.** V1 wrote the player's live value back into the mod's own
  file; V2 only ever describes what a setting *is*. The player's chosen value now lives entirely
  in Gears' own saved-settings file and world-settings file.
- **Structured properties.** What used to be a single generic `<Property type="…">` element is now
  named for what it does: `<Incremental>`, `<List>`, `<Formatter>`, `<Buttons>`, `<Wrap>`,
  `<LocalizationPrefix>`.
- **Captions, separate from descriptions.** Settings and categories can now carry a short
  `<Caption>` in addition to the `<Description>` that replaced the old `tooltipKey`.
- **Restart scope.** A global setting can declare whether changing it needs nothing, a world
  reload, or a full game restart, shown to the player automatically.
- **Preview images.** Any setting or category can show an image, and value-based settings
  (Selector, Slider, Switch) can show a different image per value.
- **Localization prefixing.** A Selector or Switch can prefix its values before localization
  lookup, so a small set of raw values can drive a full set of translated labels.
- **Percentage values.** A `float` setting can be authored as a percentage (`50%`) and is stored
  as a fraction, independent of how it is displayed.

### GearsAPI: typed C# settings

The single string-based `CurrentValue` of GearsAPI 2.0 has been replaced by a fully generic,
typed API.

- **Generic setting interfaces.** `ISelectorGlobalSetting`, `ISliderGlobalSetting`,
  `ISwitchGlobalSetting`, and their World equivalents, are now generic over the setting's value
  type, so a mod reads and writes `int`, `float`, `bool`, `string` or an enum directly — no
  parsing or formatting strings by hand.
- **Three-value model.** Every value setting now separately tracks its default, its applied
  (saved) value, and the value currently selected in the UI, along with `IsChanged`/`IsDefault`
  flags and explicit `ResetToDefault` / `DiscardCurrentChange` / `ApplyCurrentChange` operations.
- **Typed change events.** `OnSettingChanged` is now `OnSettingApplied` and carries no value; a new
  `OnValueChanged` (applied value) and `OnSelectedChanged` (UI selection) fire with the value already
  typed as `T`.
- **Attribute-based listeners.** `[SettingOnValueChanged]`, `[SettingOnSelectedChanged]`,
  `[SettingOnApplied]` and `[SettingOnEnabled]`, combined with `BindSettingsClass`, let a mod wire up
  static handler methods by setting path instead of walking the settings tree and subscribing to
  events by hand. `[SettingOnValueChanged]` and `[SettingOnSelectedChanged]` also take an optional
  `includeInSync`, which opts the handler into `SyncSettingsToClass` — see below.
- **Attribute-based member binding.** `[Setting("Tab.Category.Name")]` on a static field or property has the same
  `BindSettingsClass` call assign the named setting into it, replacing the
  `GetTab(…)?.GetCategory(…)?.GetSetting<T>(…)` chain a mod used to write per setting.
- **Binding happens once per type.** `BindSettingsClass` binds a type the first time it is handed
  one and binds nothing on any later call for that same type, on both the global and the world side.
  Re-binding used to add a duplicate of every listener, which then ran twice on each change. This
  matters most for world settings, where `OnWorldSettingsLoaded` fires again on each world load and
  rejoin against the same setting objects, so a mod binding from that callback accumulated a fresh
  copy of its listeners per load.
- **`SyncSettingsToClass(Type)`, on both `IModGlobalSettings` and `IModWorldSettings`.**
  Calls the listeners on an already-bound class that asked for `includeInSync`, handing each the value
  its setting holds right now and binding nothing. Pair it with `BindSettingsClass` to start a mod off
  in step with the saved values instead of waiting for the first change. On the world side, Gears
  applies a world's values before firing `OnWorldSettingsLoaded`, so calling it from that callback
  keeps a mod in sync across world loads, rejoins and server changes.
- **`ModSettings.xml` is now parsed before `InitMod`.** The `GameAwake` sequence is now: parse every
  mod's `ModSettings.xml` → `InitMod` → restore the player's saved global values →
  `OnGlobalSettingsLoaded`. `InitMod` used to run first, against an empty tree. Two consequences for
  a mod that creates settings in code: `GetOrCreateTab`/`GetOrCreateSetting` now hand back the
  objects the XML created, so anything the code assigns onto them **overrides what the XML said**
  (it used to be the other way round); and `GetOrCreateSetting<T>` throws `ArgumentException` when
  the XML declared that setting as a different type, rather than returning null. Declaring the same
  setting in both places is best avoided. The upside is that every setting exists by the time
  `InitMod` runs, so `BindSettingsClass` can be called there for global and world settings alike.
- **Loading a value in no longer raises its event.** While Gears reads values from XML — restoring
  the player's saved global values at startup, loading a world's values, or resetting them to
  defaults when a server sends none — `OnValueChanged` and `OnSelectedChanged` are held back.
  Loading is not a change to report, and a mod that binds early would otherwise get a burst of
  events for values that had only just arrived. A change made by the player in the UI, or by a mod's
  own code, raises exactly as before; `SyncSettingsToClass` is how a mod asks for the loaded
  values.
- **Binding never calls a listener.** `BindSettingsClass` binds and only binds, on both sides;
  `SyncSettingsToClass` is the single caller. That is what makes the usual bind-then-apply
  pair run each listener exactly once rather than twice the first time. `includeInSync` is no longer a
  bind-time trigger — it is the opt-in that decides who `SyncSettingsToClass` calls, and a
  listener without it runs only when its event fires.
- **A bound class that is never synced is reported.** After `OnGlobalSettingsLoaded` and after
  `OnWorldSettingsLoaded`, Gears logs a warning naming the mod and each class it bound that has a
  `[SettingOnValueChanged]` or `[SettingOnSelectedChanged]` listener written with
  `includeInSync: true` and was not handed to `SyncSettingsToClass` during that callback. Since
  binding calls nothing, those listeners never see the values just loaded. A class whose listeners
  all left the opt-in off is not reported — the sync would have called none of them. The check runs
  on every callback, so a world load that skips the sync is reported even when an earlier load did
  it.
- **`[SettingOnValueChanged]` now works on a world path.** A world setting raises no
  `OnValueChanged` — its applied value arrives with the world rather than changing under the player —
  so the listener is bound *invoke-only*: never raised, and called with the setting's current
  `SettingValue` by `SyncSettingsToClass`. It used to be logged and skipped. Because that call
  is its only way to run, it must be written with `includeInSync: true`; there is no exception to the
  opt-in rule and nothing is logged if you omit it. `[SettingOnApplied]` on a world path is still
  logged and skipped.
- **Custom value types.** `[SettingsSerializationProvider]` with `[SettingParser]` /
  `[SettingFormatter]` lets a mod register its own parse/format logic for a value type. Enums work
  automatically with no registration at all.
- **Colour settings are now a proper generic value setting** (`IGlobalValueSetting<Color>`)
  instead of a bespoke string-based type.
- **Categories are now settings in their own right**, gaining a caption, description and preview
  image the same as any other setting.

### Removed / renamed from GearsAPI 2.0

- The non-generic `ISelectorGlobalSetting`, `ISliderGlobalSetting`, `ISwitchGlobalSetting` and
  their World counterparts are gone, replaced by their generic equivalents above.
- `CurrentValue` (string) is gone; use the typed `SettingValue` / `SelectedValue` / `DefaultValue`.
- `TooltipKey` on an individual setting is gone; use `DescriptionKey` (and the new `CaptionKey`).
  `TooltipKey` survives only on a Tab.
- The old V1 `ModSettings.xml` schema is no longer read.

## GearsAPI 2.0 / Gears 7.0.0

Baseline: string-valued global and world settings (Selector, Slider, Switch, Color, Binding),
organised into Tabs, Categories and Settings, driven by a V1 `ModSettings.xml`, with a single
`OnSettingChanged` event per setting and no attribute-based listener or custom-type support.
