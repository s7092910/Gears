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
- **Typed change events.** `OnSettingChanged` no longer carries the new value as a string; a new
  `OnValueChanged` (applied value) and `OnSelected` (UI selection) fire with the value already
  typed as `T`.
- **Attribute-based listeners.** `[SettingOnValueChanged]`, `[SettingOnSelected]`, `[SettingOnChanged]` and
  `[SettingOnEnabled]`, combined with `BindSettingsClass`, let a mod wire up static handler
  methods by setting path instead of walking the settings tree and subscribing to events by hand.
  `[SettingOnValueChanged]` and `[SettingOnSelected]` also take an optional `invokeOnBind`, which
  calls the handler once with the setting's current value as soon as the whole class is bound, so a
  mod no longer needs a separate startup pass to read its settings in.
- **Attribute-based member binding.** `[Setting("Tab.Category.Name")]` on a static field or property has the same
  `BindSettingsClass` call assign the named setting into it, replacing the
  `GetTab(…)?.GetCategory(…)?.GetSetting<T>(…)` chain a mod used to write per setting.
- **Binding happens once per type.** `BindSettingsClass` binds a type the first time it is handed
  one and does nothing on every later call for that same type, on both the global and the world
  side. Re-binding used to add a duplicate of every listener, which then ran twice on each change.
  This matters most for world settings, where `OnWorldSettingsLoaded` fires again on each world load
  and rejoin against the same setting objects, so a mod binding from that callback accumulated a
  fresh copy of its listeners per load.
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
