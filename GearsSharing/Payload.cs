using System;
using System.IO;
using System.Text;

namespace GearsSharing
{
    /// <summary>
    /// Writes the share code payload: 7-bit varints (zigzag for signed values), length-prefixed
    /// UTF-8 strings, and raw little-endian 32-bit hashes and floats.
    /// </summary>
    internal sealed class PayloadWriter
    {
        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);

        private readonly MemoryStream stream = new MemoryStream();

        public void WriteByte(byte value)
        {
            stream.WriteByte(value);
        }

        public void WriteVarULong(ulong value)
        {
            while (value >= 0x80)
            {
                stream.WriteByte((byte)(value | 0x80));
                value >>= 7;
            }
            stream.WriteByte((byte)value);
        }

        public void WriteVarLong(long value)
        {
            WriteVarULong((ulong)((value << 1) ^ (value >> 63)));
        }

        public void WriteCount(int count)
        {
            WriteVarULong((ulong)count);
        }

        public void WriteString(string value)
        {
            byte[] bytes = Utf8.GetBytes(value);
            WriteCount(bytes.Length);
            stream.Write(bytes, 0, bytes.Length);
        }

        public void WriteUInt32(uint value)
        {
            stream.WriteByte((byte)value);
            stream.WriteByte((byte)(value >> 8));
            stream.WriteByte((byte)(value >> 16));
            stream.WriteByte((byte)(value >> 24));
        }

        public void WriteFloat(float value)
        {
            WriteUInt32(BitConverter.ToUInt32(BitConverter.GetBytes(value), 0));
        }

        public byte[] ToArray()
        {
            return stream.ToArray();
        }
    }

    /// <summary>
    /// Reads what <see cref="PayloadWriter"/> wrote. Every read is bounds checked: a truncated or
    /// tampered code throws <see cref="ShareCodeFormatException"/> rather than reading garbage.
    /// </summary>
    internal sealed class PayloadReader
    {
        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);

        private readonly byte[] data;
        private int position;

        public PayloadReader(byte[] data)
        {
            this.data = data;
        }

        public bool AtEnd => position >= data.Length;

        public byte ReadByte()
        {
            if (position >= data.Length)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.Truncated, "The share code ends unexpectedly.");
            }
            return data[position++];
        }

        public ulong ReadVarULong()
        {
            ulong result = 0;
            for (int shift = 0; shift < 64; shift += 7)
            {
                byte b = ReadByte();
                result |= (ulong)(b & 0x7F) << shift;
                if ((b & 0x80) == 0)
                {
                    return result;
                }
            }
            throw new ShareCodeFormatException(ShareCodeErrorType.MalformedData, "The share code holds a malformed number.");
        }

        public long ReadVarLong()
        {
            ulong raw = ReadVarULong();
            return (long)(raw >> 1) ^ -(long)(raw & 1);
        }

        public int ReadVarInt()
        {
            long value = ReadVarLong();
            if (value < int.MinValue || value > int.MaxValue)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.MalformedData, "The share code holds an out of range number.");
            }
            return (int)value;
        }

        /// <summary>
        /// Reads a count. Every counted item takes at least one byte, so a count larger than the
        /// bytes left is corrupt - checking that stops a tampered code from forcing a huge allocation.
        /// </summary>
        public int ReadCount()
        {
            ulong count = ReadVarULong();
            if (count > (ulong)(data.Length - position))
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.MalformedData, "The share code holds an impossible count.");
            }
            return (int)count;
        }

        public string ReadString()
        {
            ulong length = ReadVarULong();
            if (length > (ulong)(data.Length - position))
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.Truncated, "The share code ends unexpectedly.");
            }
            try
            {
                string value = Utf8.GetString(data, position, (int)length);
                position += (int)length;
                return value;
            }
            catch (DecoderFallbackException e)
            {
                throw new ShareCodeFormatException(ShareCodeErrorType.MalformedData, "The share code holds invalid text.", e);
            }
        }

        public uint ReadUInt32()
        {
            return ReadByte() | (uint)ReadByte() << 8 | (uint)ReadByte() << 16 | (uint)ReadByte() << 24;
        }

        public float ReadFloat()
        {
            return BitConverter.ToSingle(BitConverter.GetBytes(ReadUInt32()), 0);
        }
    }
}
