using System;
using System.Collections.Generic;

namespace GearsSharing
{
    /// <summary>
    /// Why a share code is not valid.
    /// </summary>
    public enum ShareCodeErrorType
    {
        /// <summary>The code is empty or only whitespace.</summary>
        Empty,
        /// <summary>The code does not start with <see cref="ShareCodeFormat.Prefix"/>.</summary>
        MissingPrefix,
        /// <summary>The code is not base64 (standard or URL-safe).</summary>
        InvalidBase64,
        /// <summary>The code was made by a format version this library does not read.</summary>
        UnsupportedVersion,
        /// <summary>The compressed payload cannot be decompressed.</summary>
        CorruptCompression,
        /// <summary>The payload decompresses to more than the 1 MB limit.</summary>
        TooLarge,
        /// <summary>The payload ends part way through a value.</summary>
        Truncated,
        /// <summary>The payload holds an impossible count, number, value type or invalid text.</summary>
        MalformedData,
        /// <summary>Bytes are left over after the last mod.</summary>
        TrailingData,
        /// <summary>The same mod, or the same setting within a mod, appears more than once.</summary>
        DuplicateSetting
    }

    /// <summary>
    /// One problem found in a share code.
    /// </summary>
    public sealed class ShareCodeError
    {
        internal ShareCodeError(ShareCodeErrorType type, string message)
        {
            ErrorType = type;
            Message = message;
        }

        /// <summary>Gets the type of problem.</summary>
        public ShareCodeErrorType ErrorType { get; }

        /// <summary>Gets a description of the problem, suitable for showing to a player.</summary>
        public string Message { get; }

        /// <inheritdoc/>
        public override string ToString() => Message;
    }

    /// <summary>
    /// The result of checking a share code.
    /// </summary>
    public sealed class ShareCodeValidationResult
    {
        internal ShareCodeValidationResult(ShareCode shareCode, IReadOnlyList<ShareCodeError> errors)
        {
            ShareCode = shareCode;
            Errors = errors;
        }

        /// <summary>
        /// Gets whether the code is valid: it could be read, and no mod or setting is repeated.
        /// </summary>
        public bool IsValid => Errors.Count == 0;

        /// <summary>
        /// Gets the problems found. Empty when the code is valid.
        /// </summary>
        public IReadOnlyList<ShareCodeError> Errors { get; }

        /// <summary>
        /// Gets the decoded contents. Set whenever the code could be read, even if a mod or setting
        /// is repeated, so an editor can show what is there; <c>null</c> if it could not be read.
        /// </summary>
        public ShareCode ShareCode { get; }
    }

    /// <summary>
    /// Thrown while reading a code; turned into a <see cref="ShareCodeError"/> by the format.
    /// </summary>
    internal sealed class ShareCodeFormatException : Exception
    {
        public ShareCodeFormatException(ShareCodeErrorType kind, string message, Exception inner = null)
            : base(message, inner)
        {
            Kind = kind;
        }

        public ShareCodeErrorType Kind { get; }
    }
}
