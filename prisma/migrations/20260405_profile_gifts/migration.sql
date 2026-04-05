-- Profile gifts / collectibles support
CREATE TABLE IF NOT EXISTS "ProfileGift" (
  "id" TEXT PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "iconUrl" TEXT,
  "rarity" TEXT,
  "metadataJson" JSONB,
  "isDisplayed" BOOLEAN NOT NULL DEFAULT true,
  "acquiredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ProfileGift_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProfileGift_profileId_acquiredAt_idx" ON "ProfileGift"("profileId", "acquiredAt");
