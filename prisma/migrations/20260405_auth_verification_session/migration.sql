-- Add DB-backed auth verification and session relations
CREATE TABLE IF NOT EXISTS "VerificationCode" (
  "id" TEXT PRIMARY KEY,
  "phoneNumber" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  "attemptsCount" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "VerificationCode_phoneNumber_createdAt_idx" ON "VerificationCode"("phoneNumber", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Session_profileId_fkey'
      AND table_name = 'Session'
  ) THEN
    ALTER TABLE "Session"
      ADD CONSTRAINT "Session_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Session_profileId_idx" ON "Session"("profileId");
