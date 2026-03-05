

## Plan: Admin Portal Switching

### What needs to happen

The admin user should be able to freely navigate between Admin, Fighter, and Merchant dashboards without logging out. This requires two changes:

1. **Remove role restrictions on route guards for admins** — Currently `FighterRoute` blocks non-fighters and `MerchantRoute` blocks non-merchants. Admins should bypass these checks.

2. **Add "Switch Portal" buttons** in the UI:
   - **Admin Dashboard**: Add buttons to switch to Fighter and Merchant views
   - **Fighter & Merchant layouts**: Show a "Back to Admin" button only when the user is an admin

### Technical changes

**1. `src/App.tsx` — Update route guards**
- `MerchantRoute`: Allow access if `isAdmin` (in addition to `isMerchant`)
- `FighterRoute`: Allow access if `isAdmin` (in addition to `isFighter`)

**2. `src/pages/admin/AdminDashboard.tsx` — Add switch buttons**
- Add two buttons/cards: "View as Fighter" (navigates to `/fighter`) and "View as Merchant" (navigates to `/merchant`)

**3. `src/components/AppLayout.tsx` — Add "Back to Admin" button**
- When `isAdmin` is true and the current path starts with `/merchant`, show a button/banner to navigate back to `/admin`

**4. `src/components/FighterLayout.tsx` — Add "Back to Admin" button**
- When `isAdmin` is true, show a button/banner to navigate back to `/admin`

**5. `src/components/AppSidebar.tsx` — Add portal switch links in sidebar**
- When `isAdmin` and viewing merchant routes, add a sidebar link back to Admin Dashboard

**6. `src/components/FighterSidebar.tsx` — Add admin link in sidebar**
- When `isAdmin`, add a sidebar link back to Admin Dashboard

**7. `src/components/MobileBottomNav.tsx` — No structural change needed**
- The "Back to Admin" button will be in the header/banner, not the bottom nav, to keep it clean

### Admin viewing other portals

The admin won't need a `merchant_id` to view the merchant dashboard — the merchant dashboard will show data based on `merchantId` from auth context (which may be null for admin). The pages should handle this gracefully (show all data or empty state). This is already partially handled since admin RLS policies grant broad read access.

