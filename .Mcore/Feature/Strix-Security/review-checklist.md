# Review areas

Use only areas touched by the scope. These are checks to investigate, not findings by themselves. Reference: [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/).

| Area | Trace and verify | Useful regression |
| --- | --- | --- |
| Authentication | Session expiry, account selection, revocation, credential comparison and failure handling | Expired or mismatched identity cannot perform an authenticated action |
| Authorization | Object ownership and role checks at each server-side read/write; alternate routes | One member cannot mutate another member's private scope |
| Input and paths | Parameterized queries, argument arrays, escaping, normalization before containment checks, links/junctions | Traversal and injected shell arguments are rejected or treated literally |
| Encryption | Authenticated ciphertext, randomness, key derivation, local key protection, validation before decryption | Tampering or wrong keys fail without returning plaintext |
| Event/data integrity | Stable IDs, replay, conflicting retries, atomic replacement, concurrency and recovery | Same retry is idempotent; different content under the same ID is rejected |
| Web boundaries | CSRF, origin checks, cookie flags, SSRF destinations, redirects and rate limits | Requests cannot cross a privilege boundary |
| Files/uploads | Storage scope, executable content, decompression limits, filename handling | An upload cannot overwrite or execute outside its destination |
| Logs/secrets | Secrets in source, errors, tool output, generated files and committed history | Failure output does not reveal credentials or private records |
| Dependencies | Installed versions, advisory evidence, used code paths and upgrade effects | Fixed version or mitigation removes the reproduced problem |

Do not include plaintext secrets in a report. Distinguish application guarantees from behavior that a filesystem owner can bypass.
