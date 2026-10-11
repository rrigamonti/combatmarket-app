## Plan: Move fighters into Combat Market v2.0, without touching this site

### Key point
I can only change the project we are chatting in. The import itself has to happen in the **Combat Market v2.0** chat. This project is only the source, and it stays exactly as it is.

What this site holds:
- **Fighters**: yes (email, name, avatar, fighter role, missions joined, proof sent, earnings)
- **Storefront products**: no. There are no products here. They live in the **Combat Market Fighters** project, which has its own database. That needs a separate export from that project's chat.

### Steps

1. **Here (this project): export the fighters**
   - Build a clean CSV file of every fighter: original ID, email, full name, avatar, signup date.
   - Optional second CSV with their mission history (joined, submitted, approved, paid amounts), if v2.0 will need it.
   - No passwords and no login data go in the files.
   - Nothing gets written or deleted here.

2. **In Combat Market Fighters: export storefronts and products**
   - In that project's chat, ask for a CSV of products per fighter, using the fighter's email as the link.

3. **In Combat Market v2.0: merge**
   - Upload both CSVs there.
   - Match fighters **by email** (lowercased). Fighter already there: keep it, fill only empty fields. Fighter missing: create it.
   - Match products by the fighter plus product URL/ID (or name if no URL). Missing products get added, existing ones are left alone.
   - Duplicate or missing emails get listed for you to decide, never merged automatically.
   - Do a test run first that only reports "X new fighters, Y new products, Z conflicts", then the real import.

4. **Logins for imported fighters**
   - The first time they log in on v2.0, they confirm their email and choose a new password. After that they see their storefront and products.

### Undo
- This site does not change at all.
- On v2.0, each imported row gets tagged with its batch, so a bad import can be removed without touching fighters who were already there. Lovable history can also roll back code changes.

### What I deliver in this chat once approved
- The fighters CSV (plus the optional mission history CSV) in your Files.
- A ready-to-paste message for the Combat Market Fighters chat and one for the v2.0 chat, describing exactly what to do.

### Technical details
- Source query: `profiles` joined with `user_roles` where role = 'fighter'; history from `mission_participations` and `submissions` keyed by `fighter_id`.
- Read-only queries, so no database changes and no code changes here.
- Files saved under /mnt/documents.
