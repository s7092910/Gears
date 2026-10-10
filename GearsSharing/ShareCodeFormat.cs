using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;

namespace GearsSharing
{
    /// <summary>
    /// Encodes, decodes and validates share codes. Has no game dependencies, so a website or tool can use it.
    /// </summary>
    /// <remarks>
    /// A code is <see cref="Prefix"/> then one header byte and a payload, written as unpadded URL-safe base64.
    /// <list type="bullet">
    /// <item>Header: bits 0-3 format version (1), bit 4 set for World, bit 5 set when the payload is raw-deflated.</item>
    /// <item>The payload is deflated only when that makes it smaller.</item>
    /// <item>Payload, for both scopes: <c>count { modHash; count { settingHash; value } }</c>.</item>
    /// <item>Names are not stored, only their hashes (<see cref="ModHash"/>, <see cref="SettingHash"/>):
    /// 32 bits each, little-endian. Whoever imports the code matches them against the mods they have.</item>
    /// <item>Counts are 7-bit varints, and each value is a type tag then its data. An empty payload means no mods.</item>
    /// <item>A code is at most <see cref="MaxCodeLength"/> characters when written; longer ones still decode.</item>
    /// </list>
    /// </remarks>
    public static class ShareCodeFormat
    {
        private const byte FormatVersion = 1;
        private const byte VersionMask = 0x0F;
        private const byte WorldScopeFlag = 0x10;
        private const byte CompressedFlag = 0x20;

        /// <summary>
        /// The most a payload may decompress to. Far beyond any real settings list; stops a tampered
        /// code from inflating without limit.
        /// </summary>
        public const int MaxPayloadBytes = 1 << 20;

        /// <summary>
        /// The longest code <see cref="Encode"/> writes, prefix included: the usual limit of a
        /// single-line text field, so a code pastes anywhere. Decoding does not enforce it.
        /// </summary>
        public const int MaxCodeLength = 32767;

        /// <summary>
        /// Starts every share code, so a player can tell one apart from other text. Case-sensitive.
        /// </summary>
        public const string Prefix = "Gears:";

        // An array, not a char: the game's mscorlib has a TrimEnd(char) overload the desktop CLR lacks.
        private static readonly char[] Base64Padding = { '=' };

        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);

        private const uint FnvOffsetBasis = 2166136261;
        private const uint FnvPrime = 16777619;

        /// <summary>
        /// Returns the hash a code holds for the mod named <paramref name="mod"/>: the 32-bit FNV-1a
        /// (Fowler–Noll–Vo) hash of its UTF-8 (8-bit Unicode Transformation Format) bytes.
        /// </summary>
        public static uint ModHash(string mod)
        {
            return Fnv1a(mod);
        }

        /// <summary>
        /// Returns the hash a code holds for a setting: 32-bit FNV-1a of the UTF-8 of
        /// <c>tab + "\0" + category + "\0" + name</c> for a Global setting, or of <c>name</c> alone
        /// for a World setting (<paramref name="tab"/> and <paramref name="category"/> <c>null</c>).
        /// </summary>
        public static uint SettingHash(string tab, string category, string name)
        {
            return tab == null && category == null ? Fnv1a(name) : Fnv1a(tab + "\0" + category + "\0" + name);
        }

        private static uint Fnv1a(string text)
        {
            uint hash = FnvOffsetBasis;
            foreach (byte b in Utf8.GetBytes(text))
            {
                hash = unchecked((hash ^ b) * FnvPrime);
            }
            return hash;
        }

        /// <summary>
        /// Encodes <paramref name="code"/> as a share code string. Mods with no settings are left out.
        /// </summary>
        /// <exception cref="ArgumentException">A name is empty, a mod or setting appears twice (or
        /// hashes the same as another), a setting has no value, a Global setting has no tab or
        /// category, or a World setting or one with no name has one.</exception>
        /// <exception cref="InvalidOperationException">The code would be longer than <see cref="MaxCodeLength"/>.</exception>
        public static string Encode(ShareCode code)
        {
            if (code == null)
            {
                throw new ArgumentNullException(nameof(code));
            }

            List<SharedMod> mods = code.Mods.Where(mod => mod != null && mod.Settings.Count > 0).ToList();
            CheckForEncoding(code.Scope, mods);

            PayloadWriter writer = new PayloadWriter();
            if (mods.Count > 0)
            {
                writer.WriteCount(mods.Count);
                foreach (SharedMod mod in mods)
                {
                    writer.WriteUInt32(mod.Address);
                    writer.WriteCount(mod.Settings.Count);
                    foreach (SharedSetting setting in mod.Settings)
                    {
                        writer.WriteUInt32(setting.Address);
                        setting.Value.Write(writer);
                    }
                }
            }

            string text = ToText(code.Scope, writer.ToArray());
            if (text.Length > MaxCodeLength)
            {
                throw new InvalidOperationException("The share code would be " + text.Length + " characters, more than the "
                    + MaxCodeLength + " a code may have. Change fewer settings from their defaults.");
            }
            return text;
        }

        /// <summary>
        /// Decodes and checks <paramref name="code"/>. Never throws for bad input; every problem is
        /// reported in <see cref="ShareCodeValidationResult.Errors"/>.
        /// </summary>
        public static ShareCodeValidationResult Validate(string code)
        {
            ShareCode shareCode;
            try
            {
                shareCode = Decode(code);
            }
            catch (ShareCodeFormatException e)
            {
                return new ShareCodeValidationResult(null, new[] { new ShareCodeError(e.Kind, e.Message) });
            }

            return new ShareCodeValidationResult(shareCode, FindRepeats(shareCode));
        }

        /// <summary>
        /// Decodes <paramref name="code"/>. Returns <c>false</c> with the first problem in
        /// <paramref name="error"/> if it is not valid.
        /// </summary>
        public static bool TryDecode(string code, out ShareCode result, out string error)
        {
            ShareCodeValidationResult validation = Validate(code);
            result = validation.IsValid ? validation.ShareCode : null;
            error = validation.IsValid ? null : validation.Errors[0].Message;
            return validation.IsValid;
        }

        // ---- Encoding ----

        /// <summary>
        /// A mod or setting with a name is addressed by the name's hash; one without (as decoded) by
        /// the hash it holds. Either way no two may share a hash, or the code could not tell them apart.
        /// </summary>
        private static void CheckForEncoding(ShareCodeScope scope, List<SharedMod> mods)
        {
            Dictionary<uint, string> modHashes = new Dictionary<uint, string>();
            foreach (SharedMod mod in mods)
            {
                if (mod.Name != null)
                {
                    RequireName(mod.Name, "mod");
                }
                string modLabel = mod.Name ?? HashLabel(mod.NameHash);
                RequireUniqueHash(modHashes, mod.Address, "mod '" + modLabel + "'");

                Dictionary<uint, string> settingHashes = new Dictionary<uint, string>();
                foreach (SharedSetting setting in mod.Settings)
                {
                    if (setting == null)
                    {
                        throw new ArgumentException("The mod '" + modLabel + "' has a null setting.");
                    }

                    if (setting.Name == null)
                    {
                        if (setting.Tab != null || setting.Category != null)
                        {
                            throw new ArgumentException("A setting with no name cannot have a tab or category.");
                        }
                    }
                    else
                    {
                        if (scope == ShareCodeScope.Global)
                        {
                            RequireName(setting.Tab, "tab");
                            RequireName(setting.Category, "category");
                        }
                        else if (setting.Tab != null || setting.Category != null)
                        {
                            throw new ArgumentException("World setting '" + setting.Name + "' cannot have a tab or category.");
                        }
                        RequireName(setting.Name, "setting");
                    }

                    string path = PathOf(mod, setting);
                    RequireUniqueHash(settingHashes, setting.Address, "setting '" + path + "'");
                    if (setting.Value is null)
                    {
                        throw new ArgumentException("The setting '" + path + "' has no value.");
                    }
                }
            }
        }

        private static void RequireName(string name, string what)
        {
            if (string.IsNullOrEmpty(name))
            {
                throw new ArgumentException("A " + what + " name is null or empty.");
            }
        }

        private static void RequireUniqueHash(Dictionary<uint, string> seen, uint hash, string what)
        {
            if (seen.TryGetValue(hash, out string other))
            {
                throw new ArgumentException(other == what
                    ? "The " + what + " is listed twice."
                    : "The " + other + " and the " + what + " have the same hash, so a code cannot tell them apart.");
            }
            seen.Add(hash, what);
        }

        private static string ToText(ShareCodeScope scope, byte[] payload)
        {
            byte header = FormatVersion;
            if (scope == ShareCodeScope.World)
            {
                header |= WorldScopeFlag;
            }

            byte[] body = payload;
            if (payload.Length > 0)
            {
                byte[] deflated = Deflate(payload);
                if (deflated.Length < payload.Length)
                {
                    body = deflated;
                    header |= CompressedFlag;
                }
            }

            byte[] bytes = new byte[body.Length + 1];
            bytes[0] = header;
            Buffer.BlockCopy(body, 0, bytes, 1, body.Length);

            return Prefix + Convert.ToBase64String(bytes).TrimEnd(Base64Padding).Replace('+', '-').Replace('/', '_');
        }

        private static byte[] Deflate(byte[] data)
        {
            using (MemoryStream output = new MemoryStream())
            {
                using (DeflateStream deflate = new DeflateStream(output, CompressionLevel.Optimal, true))
                {
                    deflate.Write(data, 0, data.Length);
                }
                return output.ToArray();
            }
        }

        // ---- Decoding ----

        private static ShareCode Decode(string code)
        {
            byte[] bytes = FromText(code);

            byte header = bytes[0];
            if ((header & VersionMask) != FormatVersion || (header & ~(VersionMask | WorldScopeFlag | CompressedFlag)) != 0)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.UnsupportedVersion,
                    "The share code was made by an unsupported version of Gears.");
            }

            ShareCode shareCode = new ShareCode((header & WorldScopeFlag) != 0 ? ShareCodeScope.World : ShareCodeScope.Global);

            byte[] payload = new byte[bytes.Length - 1];
            Buffer.BlockCopy(bytes, 1, payload, 0, payload.Length);
            if ((header & CompressedFlag) != 0)
            {
                payload = Inflate(payload);
            }

            PayloadReader reader = new PayloadReader(payload);
            int modCount = reader.AtEnd ? 0 : reader.ReadCount();
            for (int m = 0; m < modCount; m++)
            {
                SharedMod mod = new SharedMod(reader.ReadUInt32());
                int settingCount = reader.ReadCount();
                for (int s = 0; s < settingCount; s++)
                {
                    uint hash = reader.ReadUInt32();
                    mod.Settings.Add(new SharedSetting(hash, SharedValue.Read(reader)));
                }
                shareCode.Mods.Add(mod);
            }

            if (!reader.AtEnd)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.TrailingData,
                    "The share code has unexpected data after the last setting.");
            }
            return shareCode;
        }

        /// <summary>
        /// Reading succeeded; reports repeats a hand-edited code could still have.
        /// </summary>
        private static List<ShareCodeError> FindRepeats(ShareCode shareCode)
        {
            List<ShareCodeError> errors = new List<ShareCodeError>();
            HashSet<uint> modHashes = new HashSet<uint>();

            foreach (SharedMod mod in shareCode.Mods)
            {
                if (!modHashes.Add(mod.NameHash))
                {
                    errors.Add(new ShareCodeError(ShareCodeErrorType.DuplicateSetting,
                        "The mod '" + HashLabel(mod.NameHash) + "' appears more than once."));
                }

                HashSet<uint> settingHashes = new HashSet<uint>();
                foreach (SharedSetting setting in mod.Settings)
                {
                    if (!settingHashes.Add(setting.Hash))
                    {
                        errors.Add(new ShareCodeError(ShareCodeErrorType.DuplicateSetting,
                            "The setting '" + PathOf(mod, setting) + "' appears more than once."));
                    }
                }
            }
            return errors;
        }

        /// <summary>
        /// Returns the setting's display path: <c>Mod/Tab/Category/Setting</c> for Global, <c>Mod/Setting</c> for World.
        /// A mod or setting with no name (as decoded) shows its hash instead, as <c>#1a2b3c4d</c>.
        /// </summary>
        public static string PathOf(SharedMod mod, SharedSetting setting)
        {
            string modPart = mod.Name ?? HashLabel(mod.NameHash);
            if (setting.Name == null)
            {
                return modPart + "/" + HashLabel(setting.Hash);
            }
            return setting.Tab == null && setting.Category == null
                ? modPart + "/" + setting.Name
                : modPart + "/" + setting.Tab + "/" + setting.Category + "/" + setting.Name;
        }

        private static string HashLabel(uint hash)
        {
            return "#" + hash.ToString("x8", CultureInfo.InvariantCulture);
        }

        private static byte[] FromText(string code)
        {
            string text = (code ?? string.Empty).Trim();
            if (text.Length == 0)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.Empty, "The share code is empty.");
            }
            if (!text.StartsWith(Prefix, StringComparison.Ordinal))
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.MissingPrefix,
                    "This is not a Gears share code; it should start with '" + Prefix + "'.");
            }

            string base64 = new string(text.Skip(Prefix.Length).Where(c => !char.IsWhiteSpace(c)).ToArray());
            if (base64.Length == 0)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.Empty, "The share code is empty.");
            }

            base64 = base64.TrimEnd(Base64Padding).Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 1:
                    throw InvalidBase64(null);
                case 2:
                    base64 += "==";
                    break;
                case 3:
                    base64 += "=";
                    break;
            }

            try
            {
                byte[] bytes = Convert.FromBase64String(base64);
                if (bytes.Length == 0)
                {
                    throw new ShareCodeFormatException(ShareCodeErrorType.Empty, "The share code is empty.");
                }
                return bytes;
            }
            catch (FormatException e)
            {
                throw InvalidBase64(e);
            }
        }

        private static ShareCodeFormatException InvalidBase64(Exception inner)
        {
            return new ShareCodeFormatException(ShareCodeErrorType.InvalidBase64,
                "The share code contains characters that are not part of a share code.", inner);
        }

        private static byte[] Inflate(byte[] data)
        {
            try
            {
                using (MemoryStream input = new MemoryStream(data))
                using (DeflateStream inflate = new DeflateStream(input, CompressionMode.Decompress))
                using (MemoryStream output = new MemoryStream())
                {
                    byte[] buffer = new byte[4096];
                    int read;
                    while ((read = inflate.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        output.Write(buffer, 0, read);
                        if (output.Length > MaxPayloadBytes)
                        {
                            throw new ShareCodeFormatException(ShareCodeErrorType.TooLarge, "The share code is too large.");
                        }
                    }
                    return output.ToArray();
                }
            }
            catch (InvalidDataException e)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.CorruptCompression, "The share code is damaged.", e);
            }
            catch (IOException e)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.CorruptCompression, "The share code is damaged.", e);
            }
        }
    }
}
