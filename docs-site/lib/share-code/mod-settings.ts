// Reads what the share code generator needs from a mod's own files: the mod name from ModInfo.xml
// (every share code hashes it) and the World settings from ModSettings.xml. Mirrors how Gears
// loads them (Gears/Source/SettingsManager/Settings/XmlLoading/XmlSettingsParserV2.cs), so the
// page offers the settings the game will have, with the defaults it will compare against.
//
// Works on any DOM-like tree: the browser's DOMParser on the page, @xmldom/xmldom in the checks.
// Settings a mod creates from C# code are not in the XML, so they cannot be found here.

import { floatValue, type SharedValue } from './format.ts';

/** The parts of a DOM node this reader uses; met by browser and @xmldom/xmldom nodes alike. */
export interface XmlNode {
  nodeType: number;
  localName?: string | null;
  childNodes: ArrayLike<XmlNode>;
  getAttribute?(name: string): string | null;
}

export type WorldSettingElement = 'Switch' | 'Slider' | 'Selector';
export type WorldValueType = 'bool' | 'int' | 'float' | 'string' | 'enum';

export interface WorldSettingSchema {
  /** The setting name; unique within the mod's World settings, and what a code hashes. */
  name: string;
  category: string;
  element: WorldSettingElement;
  valueType: WorldValueType;
  /** The enum's type name as written in the XML, for an `enum` setting. */
  enumType?: string;
  defaultValue: SharedValue;
  /**
   * The values the setting can take, in the XML's own spelling: a Selector's `List`, or a
   * Switch's two `Buttons`. Absent when the XML does not list them.
   */
  options?: string[];
  min?: number;
  max?: number;
  increment?: number;
}

export interface WorldSchema {
  settings: WorldSettingSchema[];
  /** Problems found, each naming the setting; the setting is left out, as Gears leaves it out. */
  warnings: string[];
}

const ELEMENT_NODE = 1;

function elements(node: XmlNode): XmlNode[] {
  return Array.from(node.childNodes).filter((child) => child.nodeType === ELEMENT_NODE);
}

function attribute(node: XmlNode, name: string): string | null {
  const value = node.getAttribute?.(name);
  return value == null || value === '' ? null : value;
}

function rootOf(document: XmlNode): XmlNode | undefined {
  return document.nodeType === ELEMENT_NODE ? document : elements(document)[0];
}

/**
 * Returns the mod name from ModInfo.xml: the `value` of the first `Name` element, which may sit
 * under `<xml>` or `<ModInfo>`. `null` if there is none.
 */
export function readModName(modInfo: XmlNode): string | null {
  const stack = [modInfo];
  while (stack.length > 0) {
    const node = stack.shift() as XmlNode;
    if (node.nodeType === ELEMENT_NODE && node.localName === 'Name') {
      return attribute(node, 'value')?.trim() || null;
    }
    stack.push(...elements(node));
  }
  return null;
}

/** Reads the World settings from ModSettings.xml, as Gears would load them. */
export function readWorldSchema(modSettings: XmlNode): WorldSchema {
  const settings: WorldSettingSchema[] = [];
  const warnings: string[] = [];

  const root = rootOf(modSettings);
  if (!root || root.localName !== 'ModSettings') {
    return { settings, warnings: ['The file is not a ModSettings.xml: its root element is not <ModSettings>.'] };
  }
  if (attribute(root, 'version')?.trim() !== '2') {
    return { settings, warnings: ['Only version 2 ModSettings.xml files are supported; Gears skips this one.'] };
  }

  // Only the first <World> is read; categories that share a name are merged, so a category's
  // settings simply follow on.
  const world = elements(root).find((node) => node.localName === 'World');
  if (!world) {
    return { settings, warnings };
  }

  const names = new Set<string>();
  for (const category of elements(world).filter((node) => node.localName === 'Category')) {
    const categoryName = attribute(category, 'name') ?? '';
    for (const element of elements(category)) {
      const kind = element.localName;
      if (kind !== 'Switch' && kind !== 'Slider' && kind !== 'Selector') {
        continue;
      }

      const result = readSetting(element, kind, categoryName);
      if (typeof result === 'string') {
        warnings.push(result);
      } else if (names.has(result.name)) {
        warnings.push(`'${result.name}' appears more than once; World setting names must be unique within a mod.`);
      } else {
        names.add(result.name);
        settings.push(result);
      }
    }
  }
  return { settings, warnings };
}

/** Returns the setting, or a warning saying why Gears would drop it. */
function readSetting(element: XmlNode, kind: WorldSettingElement, category: string): WorldSettingSchema | string {
  const name = attribute(element, 'name');
  if (!name) {
    return `A ${kind} in category '${category}' has no name.`;
  }
  const rawDefault = attribute(element, 'defaultValue');
  if (rawDefault == null || rawDefault.trim() === '') {
    return `'${name}' has no defaultValue, which Gears requires.`;
  }
  const rawType = attribute(element, 'type')?.trim();
  if (!rawType) {
    return `'${name}' has no type.`;
  }

  const valueType = resolveValueType(rawType);
  if (valueType === null) {
    return `'${name}' has type '${rawType}', which a World setting cannot use.`;
  }
  const allowed: Record<WorldSettingElement, WorldValueType[]> = {
    Slider: ['int', 'float'],
    Switch: ['bool', 'string', 'enum'],
    Selector: ['int', 'float', 'string', 'enum'],
  };
  if (!allowed[kind].includes(valueType)) {
    return `'${name}' is a ${kind} of type '${rawType}', which a ${kind} cannot use.`;
  }

  const defaultValue = parseValue(valueType, rawDefault);
  if (defaultValue === null) {
    return `'${name}' has a defaultValue '${rawDefault}' that is not a valid ${valueType}.`;
  }

  const setting: WorldSettingSchema = { name, category, element: kind, valueType, defaultValue };
  if (valueType === 'enum') {
    setting.enumType = rawType;
  }

  for (const property of elements(element)) {
    if (property.localName === 'List' && kind === 'Selector') {
      const list = attribute(property, 'allowedValues');
      if (list) {
        const options = list.split(',').map((part) => part.trim());
        if (options.every((option) => parseValue(valueType, option) !== null)) {
          setting.options = options;
        }
      }
    } else if (property.localName === 'Incremental' && kind !== 'Switch' && (valueType === 'int' || valueType === 'float')) {
      const increment = parseNumber(valueType, attribute(property, 'increment'));
      const min = parseNumber(valueType, attribute(property, 'minValue'));
      const max = parseNumber(valueType, attribute(property, 'maxValue'));
      // Gears ignores the range unless all three parse.
      if (increment !== null && min !== null && max !== null) {
        Object.assign(setting, { increment, min, max });
      }
    } else if (property.localName === 'Buttons' && kind === 'Switch') {
      const left = attribute(property, 'left');
      const right = attribute(property, 'right');
      if (left && right && parseValue(valueType, left) !== null && parseValue(valueType, right) !== null) {
        setting.options = [left, right];
      }
    }
  }
  return setting;
}

/** Matches XmlSettingsParserV2.ResolveValueType; `null` for a type Gears drops for World settings. */
function resolveValueType(raw: string): WorldValueType | null {
  switch (raw.toLowerCase()) {
    case 'int':
    case 'int32':
    case 'integer':
      return 'int';
    case 'float':
    case 'single':
      return 'float';
    case 'string':
      return 'string';
    case 'bool':
    case 'boolean':
      return 'bool';
    case 'double':
    case 'color':
    case 'color32':
      return null;
    default:
      // A mod's own enum, named by type. A name that is not an enum fails in game, which this
      // page cannot check.
      return 'enum';
  }
}

/** Parses text as Gears' built-in parsers do; `null` if it is not a valid value of the type. */
export function parseValue(valueType: WorldValueType, text: string): SharedValue | null {
  switch (valueType) {
    case 'bool': {
      const value = text.trim().toLowerCase();
      return value === 'true' ? { kind: 'Bool', value: true } : value === 'false' ? { kind: 'Bool', value: false } : null;
    }
    case 'int': {
      const value = parseNumber('int', text);
      return value === null ? null : { kind: 'Int', value };
    }
    case 'float': {
      const value = parseNumber('float', text);
      return value === null ? null : floatValue(value);
    }
    case 'string':
      return { kind: 'String', value: text };
    case 'enum': {
      // The game matches member names exactly, so the name is kept as written.
      const value = text.trim();
      return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ? { kind: 'EnumName', value } : null;
    }
  }
}

/** An int, or a float where a `%` sign means a percentage ("50%" is 0.5). */
export function parseNumber(valueType: 'int' | 'float', text: string | null): number | null {
  if (text == null) {
    return null;
  }
  let value = text.trim();
  if (valueType === 'int') {
    if (!/^[+-]?\d+$/.test(value)) {
      return null;
    }
    const number = Number(value);
    return number >= -2147483648 && number <= 2147483647 ? number : null;
  }

  const percent = value.includes('%');
  value = value.replace(/%/g, '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
    return null;
  }
  const number = Number(value);
  return percent ? Math.fround(Math.fround(number) / 100) : number;
}
