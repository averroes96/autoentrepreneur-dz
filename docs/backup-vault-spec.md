# Cryptographic Specification of the Data Vault (Module 4)

This document describes the cryptographic architecture, data format, and transactional restoration protocols implemented in the **Data Vault Backup & Restore** module of Auto Entrepreneur DZ.

---

## 1. Objectives & Security Requirements

1. **Data Sovereignty**: Auto-entrepreneurs must be able to export their complete digital business heritage (invoices, quotes, credit notes, clients, expenses, profile) with zero vendor lock-in.
2. **Zero-Knowledge Confidentiality**: Optional client-side passphrase encryption protects sensitive data even when stored on untrusted media (USB flash drives, public cloud storage, email attachments).
3. **Cryptographic Integrity**: Any accidental corruption or malicious tampering with a backup file must be detected immediately before any database write operations occur.
4. **Idempotence & Resilience**: The restoration procedure must support dry-run simulation and execute within an atomic database transaction.

---

## 2. Cryptographic Architecture

The vault implements the standard cryptographic suite recommended by NIST and ANSSI:

### 2.1 Key Derivation Function (KDF): `scrypt`
The user's passphrase is never used directly as a symmetric key. A 256-bit key is derived using the `scrypt` algorithm:
- **Derived Key Size**: 32 bytes (256 bits)
- **Cryptographic Salt**: 32 random bytes generated via `crypto.randomBytes(32)`
- **scrypt Parameters**:
  - `N` (CPU/memory cost): $16\,384$ ($2^{14}$)
  - `r` (block size): $8$
  - `p` (parallelization): $1$
  - `maxmem`: 32 MB

### 2.2 Authenticated Symmetric Encryption: `AES-256-GCM`
- **Algorithm**: Advanced Encryption Standard in Galois/Counter Mode (`aes-256-gcm`).
- **Initialization Vector (IV / Nonce)**: 16 bytes generated uniquely per export (`crypto.randomBytes(16)`).
- **Authentication Tag (Auth Tag)**: 16 bytes (128 bits) guaranteeing authenticity and ciphertext integrity.

### 2.3 Global Integrity Checksum: `SHA-256`
Before encryption, a SHA-256 hash is computed across the canonical JSON string:
$$\text{checksum} = \text{SHA-256}(\text{JSON.stringify}(data))$$
During restore, the decrypted payload is verified against this checksum prior to database injection.

---

## 3. Export Formats & File Structure

### 3.1 Encrypted JSON Format (`.vault.json`)
```json
{
  "vaultVersion": "1.0.0",
  "encryptedAt": "2026-10-09T14:30:00.000Z",
  "algorithm": "aes-256-gcm",
  "kdf": "scrypt",
  "salt": "<hex_64_chars>",
  "iv": "<hex_32_chars>",
  "authTag": "<hex_32_chars>",
  "ciphertext": "<base64_payload_string>",
  "checksumSha256": "<hex_64_chars>"
}
```

### 3.2 Complete ZIP Vault Archive (`.zip`)
For users requiring both machine-readable backups and human-readable spreadsheets:

```
AutoEntrepreneurDZ_Vault_Backup_2026-10-09_Karim_Meziane.zip
├── data_vault.json               # Full JSON payload (or data_vault.enc.json if encrypted)
├── vault_manifest.json           # Metadata, version, timestamp, and SHA-256 checksum
├── 01_clients.csv                # Client directory
├── 02_factures.csv               # Sales invoices ledger
├── 03_devis.csv                  # Commercial quotes ledger
├── 04_avoirs.csv                 # Credit notes ledger
├── 05_depenses.csv               # Operating expenses journal
└── 06_instructions_restauration.txt # Offline restoration guide
```

---

## 4. Transactional Restoration Protocol

Data restoration follows a strict 3-stage validation workflow:

```
┌─────────────────────────────────┐
│     1. Pre-Restore & Dry-Run    │
│ • Detect ZIP vs JSON format     │
│ • Detect encryption status      │
│ • Verify passphrase & decrypt   │
│ • Validate SHA-256 checksum     │
└────────────────┬────────────────┘
                 │ Success
┌────────────────▼────────────────┐
│   2. User Strategy Selection    │
│ • Merge Mode                    │
│ • Overwrite Mode                │
└────────────────┬────────────────┘
                 │ User Confirms
┌────────────────▼────────────────┐
│ 3. Atomic Transaction Injection │
│ • prisma.$transaction(...)     │
│ • Update Profile & Tax settings │
│ • Upsert Clients                │
│ • Restore Invoices & Line items │
│ • Restore Quotes, Avoirs, Costs │
└─────────────────────────────────┘
```

### Restoration Modes:
* **Merge Mode**: Updates existing records and inserts missing entities without deleting existing database records. Recommended for syncing devices or non-destructive imports.
* **Overwrite Mode**: Clears existing tenant records before inserting backup data. Recommended for disaster recovery or rolling back to a known certified state.
