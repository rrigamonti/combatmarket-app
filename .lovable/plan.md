## Plan: Move fighters and their products into Combat Market v2.0

### What we found
- **This site (combatmarket-app)** has only 1 fighter, your own account (info@rrigamonti.com), and no products. There's nothing here worth exporting.
- **[Combat Market Fighters](/projects/d1906652-62a2-46f1-95b6-15664f8b452d)** is the app where fighters register, get approved and open their storefronts with products. The real fighters and products are almost certainly there.
- **[Combat Market v 2.0](/projects/d78224ce-da30-4fb2-8b61-7046b5df2bf2)** is where everything has to end up.

Each project has its own database, and I can't read another project's data from here. So the move goes through two exports and one import, each done in that project's own chat. Neither this site nor Combat Market Fighters gets changed.

### Steps
1. **In the Combat Market Fighters chat: export**
   - Ask for CSV files of all fighters (email, name, profile and storefront info) and all products, with each product linked to its fighter's email.
   - No passwords and no login data.
   - Check how many fighters and products it finds there.

2. **In the Combat Market v2.0 chat: merge**
   - Upload the CSVs.
   - Match fighters **by email**. A fighter already in v2.0 stays as it is, only empty fields get filled. A missing fighter gets added.
   - Match products by fighter plus product link/ID, or by name if there's no link. Missing products get added, existing ones stay as they are.
   - Duplicate or missing emails are shown to you to decide. They're never merged automatically.
   - Start with a dry run that only reports "X new fighters, Y new products, Z conflicts". The real import runs after you approve it.
   - Every imported row is tagged with its batch, so a bad import can be removed without touching what was already in v2.0.

3. **Logins**
   - Imported fighters log in on v2.0 with the same email. The first time, they confirm their email and choose a new password.

### What I deliver here once approved
Two ready-to-paste messages, one for each of those chats, with the exact instructions above. This site isn't touched.
