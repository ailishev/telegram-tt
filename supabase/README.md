# Supabase setup for telegram-tt backend migration

1. Create a Supabase project.
2. Run SQL from `supabase/sql/001_init_telegram_tt.sql` in SQL editor.
3. Enable Email auth provider in Supabase Auth (used as phone-identity bridge in dev mode).
4. Copy `.env.example` to `.env` and fill keys.
5. Run app with mocked transport + Supabase persistence:
   - `npm install`
   - `npm run dev`

## Notes
- The frontend keeps Telegram Web A screen flow and uses the mocked client transport, but all identity/profile/chat source data now comes from Supabase tables when configured.
- Dev phone-code flow accepts any 5-digit code and maps phone number to a deterministic synthetic email in Supabase Auth.
