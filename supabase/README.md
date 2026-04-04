# Supabase setup for telegram-tt backend migration

1. Create a Supabase project.
2. Run SQL from:
   - `supabase/sql/001_init_telegram_tt.sql`
   - `supabase/sql/002_auth_flow_and_rpc.sql`
3. In **Auth > Providers > Email**:
   - enable Email provider
   - enable Signups
   - disable email confirmation for dev (or sign-in after manual confirmation)
4. Copy `.env.example` to `.env` and fill keys.
5. Run app with mocked transport + Supabase persistence:
   - `npm install`
   - `npm run dev`

## Notes
- The frontend keeps Telegram Web A screen flow and uses the mocked client transport, but all identity/profile/chat source data now comes from Supabase tables when configured.
- Dev phone-code flow uses a fixed code `11111` and maps phone number to a deterministic synthetic email in Supabase Auth.
- Password is internal/derived from phone in dev bridge; user still logs in only by phone + code in Telegram UI.
- TG-like first login onboarding is finalized via RPC `tg_complete_onboarding`.
