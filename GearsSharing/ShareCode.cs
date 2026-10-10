using System.Collections.Generic;

namespace GearsSharing
{
    /// <summary>
    /// Which settings a share code holds.
    /// </summary>
    public enum ShareCodeScope
    {
        /// <summary>Player-level settings, addressed by mod, tab, category and setting name.</summary>
        Global,
        /// <summary>Per-world settings, addressed by mod and setting name.</summary>
        World
    }

    /// <summary>
    /// The contents of a share code: the settings that differ from their defaults, grouped by mod.
    /// </summary>
    public sealed class ShareCode
    {
        /// <summary>
        /// Creates an empty share code for <paramref name="scope"/>.
        /// </summary>
        public ShareCode(ShareCodeScope scope)
        {
            Scope = scope;
        }

        /// <summary>
        /// Gets whether the code holds Global or World settings.
        /// </summary>
        public ShareCodeScope Scope { get; }

        /// <summary>
        /// Gets the mods in the code, in the order they are written.
        /// </summary>
        public List<SharedMod> Mods { get; } = new List<SharedMod>();
    }

    /// <summary>
    /// One mod's settings in a share code.
    /// </summary>
    /// <remarks>
    /// A code holds only a hash of each name. To encode, set <see cref="Name"/> and the hash is
    /// worked out from it. A decoded code has only <see cref="NameHash"/>, with <see cref="Name"/>
    /// left <c>null</c>; whoever knows the mod can match it with <see cref="ShareCodeFormat.ModHash"/>.
    /// </remarks>
    public sealed class SharedMod
    {
        /// <summary>
        /// Creates an entry for the mod named <paramref name="name"/>, as in its <c>ModInfo.xml</c>.
        /// </summary>
        public SharedMod(string name)
        {
            Name = name;
        }

        /// <summary>
        /// Creates an entry for a mod known only by the hash of its name.
        /// </summary>
        public SharedMod(uint nameHash)
        {
            NameHash = nameHash;
        }

        /// <summary>
        /// Gets or sets the mod's name, as in its <c>ModInfo.xml</c>. <c>null</c> in a decoded code.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the hash of the mod's name. Only used while <see cref="Name"/> is <c>null</c>.
        /// </summary>
        public uint NameHash { get; set; }

        /// <summary>
        /// Gets the hash the code holds for this mod.
        /// </summary>
        internal uint Address => Name != null ? ShareCodeFormat.ModHash(Name) : NameHash;

        /// <summary>
        /// Gets the mod's settings. They can be listed in any order: the encoder groups them by tab and category.
        /// </summary>
        public List<SharedSetting> Settings { get; } = new List<SharedSetting>();
    }

    /// <summary>
    /// One setting and its value in a share code.
    /// </summary>
    /// <remarks>
    /// A code holds only a hash of each setting's address. To encode, set the names and the hash is
    /// worked out from them. A decoded setting has only <see cref="Hash"/>, with every name left
    /// <c>null</c>; whoever knows the mod can match it with <see cref="ShareCodeFormat.SettingHash"/>.
    /// </remarks>
    public sealed class SharedSetting
    {
        /// <summary>
        /// Creates a Global setting entry.
        /// </summary>
        public SharedSetting(string tab, string category, string name, SharedValue value)
        {
            Tab = tab;
            Category = category;
            Name = name;
            Value = value;
        }

        /// <summary>
        /// Creates a World setting entry. World setting names are unique within a mod, so no tab or category is stored.
        /// </summary>
        public SharedSetting(string name, SharedValue value)
            : this(null, null, name, value)
        {
        }

        /// <summary>
        /// Creates an entry for a setting known only by the hash of its address.
        /// </summary>
        public SharedSetting(uint hash, SharedValue value)
            : this(null, null, null, value)
        {
            Hash = hash;
        }

        /// <summary>
        /// Gets or sets the tab name. <c>null</c> for a World setting or in a decoded code.
        /// </summary>
        public string Tab { get; set; }

        /// <summary>
        /// Gets or sets the category name. <c>null</c> for a World setting or in a decoded code.
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// Gets or sets the setting name. <c>null</c> in a decoded code.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the hash of the setting's address. Only used while <see cref="Name"/> is <c>null</c>.
        /// </summary>
        public uint Hash { get; set; }

        /// <summary>
        /// Gets the hash the code holds for this setting.
        /// </summary>
        internal uint Address => Name != null ? ShareCodeFormat.SettingHash(Tab, Category, Name) : Hash;

        /// <summary>
        /// Gets or sets the setting's value.
        /// </summary>
        public SharedValue Value { get; set; }
    }
}
