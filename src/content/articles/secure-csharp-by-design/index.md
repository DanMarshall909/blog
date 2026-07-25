---
title: "Secure C# Starts with System Design"
author: Dan Marshall
date: "2026-07-25"
tags: ["C#", "security", "software-design", "dependency-management"]
description: "Secure C# begins with system boundaries and disciplined use of the language: narrow APIs, immutable state, short-lived secrets and deliberate dependencies."
---

Secure software involves more than using secure methods or ticking items off the OWASP Top 10. It depends on the design of the system as a whole.

C# lets us enforce that design through access modifiers, immutable types, narrow interfaces, spans and explicit ownership. These features control where security decisions are made, how far sensitive data travels and who can modify trusted state.

Cryptographic choices still matter, but good primitives can be used badly. The goal is to make the secure path the easy path: keep security responsibilities cohesive, expose intent rather than machinery, protect trusted state and minimise the lifetime of secrets. This helps developers [fall into the pit of success](https://blog.codinghorror.com/falling-into-the-pit-of-success/).

---

## Keep Security Responsibilities Cohesive

Security-related behaviour should have an obvious home: perhaps a dedicated project containing encryption, signing, token handling and secret-management integrations. This should be a small boundary with a clear responsibility and narrow API, not a miscellaneous `Security` project containing every authentication check.

Code outside that boundary should ask for an outcome:

```csharp
var protectedValue = customerDataProtector.Protect(customerReference);
```

It should not assemble that outcome from primitives:

```csharp
var nonce = RandomNumberGenerator.GetBytes(12);
var key = keyStore.GetKey("customer-data");
var ciphertext = Encrypt(plaintext, key, nonce);
var result = Combine(nonce, ciphertext);
```

The second version lets every caller omit a step, choose the wrong key, reuse a nonce or invent a payload format. A cohesive project instead gives reviewers one place to inspect policy, makes dependency changes visible and allows the complete operation to be tested.

---

## Expose Intent, Not Primitives

Most of that project's implementation should be `internal` (the most underused keyword in C#). Cipher implementations, key resolvers, nonce generators and serialisation helpers rarely need to be called by the rest of the application. The public surface should describe only the permitted operations:

```csharp
public interface ICustomerDataProtector
{
    ProtectedCustomerData Protect(CustomerReference value);
    CustomerData Unprotect(ProtectedCustomerData value);
}

internal sealed class AesGcmCustomerDataProtector : ICustomerDataProtector
{
    // Algorithm selection, key lookup and payload formatting stay here.
}
```

`internal` is not a security boundary against malicious code in the same process, and reflection can bypass it. It is a design boundary that reduces accidental misuse. Prefer operations such as `ProtectCustomerData` or `SignPaymentInstruction` over general methods accepting arbitrary algorithms, keys and byte arrays. Do not make every dangerous choice configurable merely because it can be. This is one place where tight coupling is arguably a good thing.

---

## Avoid Primitive Obsession with Immutable Types

To paraphrase Martin Fowler, **Primitive Obsession** is the use of basic types such as `string`, `int` or `decimal` to represent specific concepts. This weakens expressiveness and type safety for example, by making unrelated identifiers interchangeable. In security-sensitive code, it also wastes an opportunity to guide consumers towards safe usage.

A `string` can represent a customer reference, password, access token or encrypted payload. A `byte[]` can contain plaintext, ciphertext, a key or a nonce. When an API accepts primitives, the compiler cannot stop callers from passing the wrong value.

Give security-sensitive values their own immutable types instead. The type should validate its complete state when created and expose only the operations consumers need:

```csharp
public sealed record CustomerReference
{
    private CustomerReference(string value)
    {
        Value = value;
    }

    public static CustomerReference Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(
                "A customer reference is required.",
                nameof(value));

        return new CustomerReference(value);
    }

    internal string Value { get; }
}
```

The security API can now require a `CustomerReference` and return `ProtectedCustomerData`. A consumer cannot accidentally pass an access token or unvalidated string just because both happen to share the same underlying representation:

```csharp
ProtectedCustomerData Protect(CustomerReference customerReference);
```

This moves validation and representation rules into the type that owns them, forcing consumers onto a path designed with security in mind. Immutability ensures the value cannot become invalid after construction.

Avoid public setters, partial initialisation and collections callers can modify after validation. A read-only view does not make its underlying collection immutable:

```csharp
public IReadOnlyList<string> Roles { get; }
```

If this wraps a caller-owned `List<string>`, the caller can still change it. Copy the input instead:

```csharp
public sealed class SecurityPolicy
{
    public SecurityPolicy(IEnumerable<string> roles)
    {
        Roles = roles.ToImmutableArray();
    }

    public ImmutableArray<string> Roles { get; }
}
```

Useful C# techniques related to security and immutability include:

- use `readonly` fields so references cannot be reassigned after construction;
- use getter-only properties rather than public setters;
- use `readonly record struct` for small value types;
- seal security-sensitive types so subclasses cannot change their behaviour;
- use `ImmutableArray<T>`, `ImmutableDictionary<TKey, TValue>` and other immutable collections;
- use frozen collections for lookup data constructed once and then shared;
- accept `ReadOnlySpan<T>` or `ReadOnlyMemory<T>` when a method only needs to read a caller-owned buffer;
- make defensive copies at ownership boundaries;
- validate the complete value in a constructor or factory before exposing it.

These mechanisms have different strengths. `init` restricts assignment but does not make referenced objects immutable. Read-only interfaces, spans and memory prevent mutation only through that API. Frozen collections prevent structural changes, but their contents may still be mutable.

There is one deliberate exception: temporary buffers that contain plaintext secrets may need to be mutable so they can be overwritten. Those buffers should not become general-purpose domain objects. Keep them locally owned, expose them only as spans where possible, and clear them immediately after use.

Across trust boundaries, add other controls. Database constraints can reject invalid state, and concurrency tokens can reject stale updates. Hashes detect accidental changes; keyed MACs and digital signatures detect tampering and establish authenticity.

---

## Keep Plaintext Alive for as Little Time as Possible

Decrypt sensitive data as late as possible, use it for one purpose and discard it as soon as possible.

Avoid putting plaintext into:

- logs, exceptions or tracing tags;
- long-lived domain objects;
- caches;
- queues and events;
- temporary files;
- diagnostic snapshots;
- strings created only for formatting or conversion.

This reduces obvious leaks and limits copies in memory, crash dumps, telemetry and debugging tools. C# makes strict memory lifetime difficult: a `string` may be copied and cannot reliably be erased on demand. For sensitive binary data, prefer a short-lived mutable buffer and clear it in a `finally` block:

```csharp
byte[] plaintext = ArrayPool<byte>.Shared.Rent(requiredLength);

try
{
    var written = decryptor.Unprotect(protectedValue, plaintext);
    ProcessPlaintext(plaintext.AsSpan(0, written));
}
finally
{
    CryptographicOperations.ZeroMemory(plaintext);
    ArrayPool<byte>.Shared.Return(plaintext);
}
```

This cannot guarantee a secret was never copied, but it is stronger than waiting for garbage collection. Do not return spans over sensitive buffers or leave their contents in pooled memory. Ownership and lifetime should be obvious.

---

## Minimise Dependencies, Not Proven Safety

Every dependency adds code to understand, update and monitor. It can introduce vulnerable transitive packages, unsafe defaults or more capability than the security boundary requires.

Keep the security project's dependency graph small. Prefer .NET cryptography APIs and platform facilities where they meet the requirement. Do not add packages for minor conveniences or bring in an application framework without a specific reason.

But “fewer libraries” should not become “rewrite everything”.

LINQ is part of .NET and is not automatically a meaningful security risk. Entity Framework adds substantial behaviour and dependencies, but replacing it with hand-built SQL can increase the risk of injection and incorrect data handling. Mature, maintained libraries and parameterised queries are generally safer than bespoke replacements.

The useful questions are:

- Does this dependency need to exist inside the trusted boundary?
- Which transitive dependencies does it introduce?
- Is it maintained and patched?
- Does the team understand its security-relevant behaviour?
- Can a smaller, established API meet the same requirement?
- Are we removing it for a measurable reason or only for aesthetic purity?

Minimise unnecessary capability and complexity, not well-tested safety mechanisms.

---

## Do Not Build Your Own Cryptography

Keeping security code together does not mean implementing cryptographic algorithms yourself. Use established primitives and protocols, while centralising algorithm selection, key identifiers, payload versions, associated data, rotation and failure handling.

The public API should avoid choices callers are not required to make. They generally should not select an encryption algorithm:

```csharp
// Too much authority at every call site.
Encrypt(data, algorithm, mode, padding, key, nonce);

// The operation owns its security policy.
customerDataProtector.Protect(data);
```

The implementation and versioned payload format can then change without editing every caller. Authentication failures must not return partial plaintext, and errors should not reveal whether a key, account or field was valid.

---

## Treat the Project Boundary as a Review Boundary

A cohesive project is valuable only if its changes receive appropriate scrutiny:

- requiring review from people familiar with the security model;
- testing invalid, truncated and tampered payloads;
- checking that secrets never enter logs or telemetry;
- scanning direct and transitive dependencies;
- recording why an algorithm or protocol was selected;
- designing and testing key rotation before it is urgent;
- keeping payload formats versioned;
- rejecting insecure defaults rather than silently recovering.

Tests should exercise the permitted public operations. Internal primitives may have focused tests, but the important question is whether ordinary application code can use the boundary safely.

---

## Conclusion - Security Is Also an API Design Problem

Amoungst other things secure code comes from reducing the number of places that make security decisions.

- Keep the implementation cohesive and mostly internal.
- Expose narrow operations named after intent.
- Use immutable security state, minimise plaintext lifetimes and keep dependencies deliberate.
- Use proven primitives without exposing their sharp edges throughout the application.

None of these measures is a complete security boundary alone. Together, they make the system easier to reason about, review and use safely and will go a long way to preventing you from making mistakes that could cost you an awful lot of heartache.
