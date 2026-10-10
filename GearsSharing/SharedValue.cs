using System;
using System.Globalization;

namespace GearsSharing
{
    /// <summary>
    /// One setting value in a share code. Create one with the static factory for its kind; each kind
    /// is its own sealed subclass holding only its own data.
    /// </summary>
    /// <remarks>
    /// Two values are equal when they have the same kind and the same bits, so <c>NaN</c> (not a
    /// number) equals <c>NaN</c> and <c>-0</c> does not equal <c>0</c>.
    /// </remarks>
    public abstract class SharedValue : IEquatable<SharedValue>
    {
        // Wire tags. Several kinds have a compact form the writer picks automatically.
        private protected const byte TagFalse = 0;
        private protected const byte TagTrue = 1;
        private protected const byte TagInt = 2;
        private protected const byte TagWholeFloat = 3;
        private protected const byte TagFloat = 4;
        private protected const byte TagNullString = 5;
        private protected const byte TagString = 6;
        private protected const byte TagEnumName = 7;
        private protected const byte TagEnumValue = 8;
        private protected const byte TagColor32 = 9;
        private protected const byte TagColor = 10;
        private protected const byte TagSerialized = 11;

        // Only this assembly can add kinds: each one needs a wire tag.
        private protected SharedValue()
        {
        }

        /// <summary>Creates a <see cref="SharedBool"/> value.</summary>
        public static SharedBool Bool(bool value) => value ? SharedBool.True : SharedBool.False;

        /// <summary>Creates a <see cref="SharedInt"/> value.</summary>
        public static SharedInt Int(int value) => new SharedInt(value);

        /// <summary>Creates a <see cref="SharedFloat"/> value.</summary>
        public static SharedFloat Float(float value) => new SharedFloat(value);

        /// <summary>Creates a <see cref="SharedString"/> value. <paramref name="value"/> may be <c>null</c>.</summary>
        public static SharedString String(string value) => new SharedString(value);

        /// <summary>Creates a <see cref="SharedEnumName"/> value from an enum member name.</summary>
        public static SharedEnumName EnumName(string name) =>
            new SharedEnumName(name ?? throw new ArgumentNullException(nameof(name)));

        /// <summary>Creates a <see cref="SharedEnumValue"/> value from an enum's underlying number.</summary>
        public static SharedEnumValue EnumValue(long value) => new SharedEnumValue(value);

        /// <summary>Creates a <see cref="SharedColor"/> value from RGBA channels, normally 0 to 1.</summary>
        public static SharedColor Color(float r, float g, float b, float a) => new SharedColor(r, g, b, a);

        /// <summary>Creates a <see cref="SharedSerialized"/> value: a mod-registered type's serialized text.</summary>
        public static SharedSerialized Serialized(string text) =>
            new SharedSerialized(text ?? throw new ArgumentNullException(nameof(text)));

        /// <inheritdoc/>
        public abstract bool Equals(SharedValue other);

        /// <inheritdoc/>
        public override bool Equals(object obj) => obj is SharedValue other && Equals(other);

        /// <inheritdoc/>
        public abstract override int GetHashCode();

        /// <summary>
        /// Returns the value as text, for display. Floats use the shortest round-trip form.
        /// </summary>
        public abstract override string ToString();

        /// <summary>Returns <c>true</c> if both values have the same kind and bits, or both are <c>null</c>.</summary>
        public static bool operator ==(SharedValue left, SharedValue right) =>
            left is null ? right is null : left.Equals(right);

        /// <summary>Returns <c>true</c> if the values differ in kind or bits.</summary>
        public static bool operator !=(SharedValue left, SharedValue right) => !(left == right);

        internal abstract void Write(PayloadWriter writer);

        internal static SharedValue Read(PayloadReader reader)
        {
            byte tag = reader.ReadByte();
            switch (tag)
            {
                case TagFalse:
                    return SharedBool.False;
                case TagTrue:
                    return SharedBool.True;
                case TagInt:
                    return Int(reader.ReadVarInt());
                case TagWholeFloat:
                    return Float(reader.ReadVarInt());
                case TagFloat:
                    return Float(reader.ReadFloat());
                case TagNullString:
                    return String(null);
                case TagString:
                    return String(reader.ReadString());
                case TagEnumName:
                    return EnumName(reader.ReadString());
                case TagEnumValue:
                    return EnumValue(reader.ReadVarLong());
                case TagColor32:
                    return Color(reader.ReadByte() / 255f, reader.ReadByte() / 255f,
                                 reader.ReadByte() / 255f, reader.ReadByte() / 255f);
                case TagColor:
                    return Color(reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat());
                case TagSerialized:
                    return Serialized(reader.ReadString());
                default:
                    throw new ShareCodeFormatException(ShareCodeErrorType.MalformedData,
                        "The share code holds an unknown value type (" + tag + ").");
            }
        }

        private protected static int Bits(float value) => BitConverter.ToInt32(BitConverter.GetBytes(value), 0);

        private protected static bool SameBits(float x, float y) => Bits(x) == Bits(y);

        private protected static string FormatFloat(float value) => value.ToString("R", CultureInfo.InvariantCulture);
    }

    /// <summary>A <c>bool</c> value (Switch).</summary>
    public sealed class SharedBool : SharedValue
    {
        internal static readonly SharedBool True = new SharedBool(true);
        internal static readonly SharedBool False = new SharedBool(false);

        private SharedBool(bool value)
        {
            Value = value;
        }

        /// <summary>Gets the value.</summary>
        public bool Value { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedBool o && o.Value == Value;

        /// <inheritdoc/>
        public override int GetHashCode() => Value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => Value ? "True" : "False";

        internal override void Write(PayloadWriter writer)
        {
            writer.WriteByte(Value ? TagTrue : TagFalse);
        }
    }

    /// <summary>An <c>int</c> value (Slider, Selector).</summary>
    public sealed class SharedInt : SharedValue
    {
        internal SharedInt(int value)
        {
            Value = value;
        }

        /// <summary>Gets the value.</summary>
        public int Value { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedInt o && o.Value == Value;

        /// <inheritdoc/>
        public override int GetHashCode() => Value;

        /// <inheritdoc/>
        public override string ToString() => Value.ToString(CultureInfo.InvariantCulture);

        internal override void Write(PayloadWriter writer)
        {
            writer.WriteByte(TagInt);
            writer.WriteVarLong(Value);
        }
    }

    /// <summary>A <c>float</c> value (Slider, Selector), kept bit for bit.</summary>
    public sealed class SharedFloat : SharedValue
    {
        // A whole float is only worth a varint while the varint stays under the 4 raw bytes.
        private const long WholeFloatLimit = 1 << 20;

        internal SharedFloat(float value)
        {
            Value = value;
        }

        /// <summary>Gets the value.</summary>
        public float Value { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedFloat o && SameBits(o.Value, Value);

        /// <inheritdoc/>
        public override int GetHashCode() => Bits(Value);

        /// <inheritdoc/>
        public override string ToString() => FormatFloat(Value);

        internal override void Write(PayloadWriter writer)
        {
            if (IsWhole(Value))
            {
                writer.WriteByte(TagWholeFloat);
                writer.WriteVarLong((long)Value);
            }
            else
            {
                writer.WriteByte(TagFloat);
                writer.WriteFloat(Value);
            }
        }

        private static bool IsWhole(float value)
        {
            return value > -WholeFloatLimit && value < WholeFloatLimit
                && value == (float)Math.Truncate(value)
                && !(value == 0f && Bits(value) != 0);
        }
    }

    /// <summary>A <c>string</c> value, which may be <c>null</c>.</summary>
    public sealed class SharedString : SharedValue
    {
        internal SharedString(string value)
        {
            Value = value;
        }

        /// <summary>Gets the value, possibly <c>null</c>.</summary>
        public string Value { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedString o && o.Value == Value;

        /// <inheritdoc/>
        public override int GetHashCode() => Value?.GetHashCode() ?? 0;

        /// <inheritdoc/>
        public override string ToString() => Value ?? "null";

        internal override void Write(PayloadWriter writer)
        {
            if (Value == null)
            {
                writer.WriteByte(TagNullString);
            }
            else
            {
                writer.WriteByte(TagString);
                writer.WriteString(Value);
            }
        }
    }

    /// <summary>An enum value, by member name.</summary>
    public sealed class SharedEnumName : SharedValue
    {
        internal SharedEnumName(string name)
        {
            Name = name;
        }

        /// <summary>Gets the enum member name.</summary>
        public string Name { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedEnumName o && o.Name == Name;

        /// <inheritdoc/>
        public override int GetHashCode() => Name.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => Name;

        internal override void Write(PayloadWriter writer)
        {
            writer.WriteByte(TagEnumName);
            writer.WriteString(Name);
        }
    }

    /// <summary>An enum value with no member name of its own (a flags combination), by number.</summary>
    public sealed class SharedEnumValue : SharedValue
    {
        internal SharedEnumValue(long value)
        {
            Value = value;
        }

        /// <summary>Gets the enum's underlying number. An enum based on <c>ulong</c> is stored reinterpreted as <c>long</c>.</summary>
        public long Value { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedEnumValue o && o.Value == Value;

        /// <inheritdoc/>
        public override int GetHashCode() => Value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => Value.ToString(CultureInfo.InvariantCulture);

        internal override void Write(PayloadWriter writer)
        {
            writer.WriteByte(TagEnumValue);
            writer.WriteVarLong(Value);
        }
    }

    /// <summary>A color of red, green, blue and alpha (RGBA) channels, each a <c>float</c> kept bit for bit.</summary>
    public sealed class SharedColor : SharedValue
    {
        internal SharedColor(float r, float g, float b, float a)
        {
            R = r;
            G = g;
            B = b;
            A = a;
        }

        /// <summary>Gets the red channel, normally 0 to 1.</summary>
        public float R { get; }

        /// <summary>Gets the green channel, normally 0 to 1.</summary>
        public float G { get; }

        /// <summary>Gets the blue channel, normally 0 to 1.</summary>
        public float B { get; }

        /// <summary>Gets the alpha channel, normally 0 to 1.</summary>
        public float A { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) =>
            other is SharedColor o && SameBits(o.R, R) && SameBits(o.G, G) && SameBits(o.B, B) && SameBits(o.A, A);

        /// <inheritdoc/>
        public override int GetHashCode()
        {
            unchecked
            {
                int hash = Bits(R);
                hash = hash * 31 + Bits(G);
                hash = hash * 31 + Bits(B);
                return hash * 31 + Bits(A);
            }
        }

        /// <inheritdoc/>
        public override string ToString() => FormatFloat(R) + "," + FormatFloat(G) + "," + FormatFloat(B) + "," + FormatFloat(A);

        /// <summary>
        /// A color picked in the UI is always whole 0-255 channels, which fit in a byte each. Any
        /// other color keeps its exact floats.
        /// </summary>
        internal override void Write(PayloadWriter writer)
        {
            if (TryGetByte(R, out byte rb) && TryGetByte(G, out byte gb) && TryGetByte(B, out byte bb) && TryGetByte(A, out byte ab))
            {
                writer.WriteByte(TagColor32);
                writer.WriteByte(rb);
                writer.WriteByte(gb);
                writer.WriteByte(bb);
                writer.WriteByte(ab);
            }
            else
            {
                writer.WriteByte(TagColor);
                writer.WriteFloat(R);
                writer.WriteFloat(G);
                writer.WriteFloat(B);
                writer.WriteFloat(A);
            }
        }

        private static bool TryGetByte(float channel, out byte value)
        {
            value = 0;
            if (!(channel >= 0f && channel <= 1f))
            {
                return false;
            }
            value = (byte)Math.Round(channel * 255.0);
            return SameBits(value / 255f, channel);
        }
    }

    /// <summary>A mod-registered value type, as written by that type's own serializer.</summary>
    public sealed class SharedSerialized : SharedValue
    {
        internal SharedSerialized(string text)
        {
            Text = text;
        }

        /// <summary>Gets the serialized text.</summary>
        public string Text { get; }

        /// <inheritdoc/>
        public override bool Equals(SharedValue other) => other is SharedSerialized o && o.Text == Text;

        /// <inheritdoc/>
        public override int GetHashCode() => Text.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => Text;

        internal override void Write(PayloadWriter writer)
        {
            writer.WriteByte(TagSerialized);
            writer.WriteString(Text);
        }
    }
}
