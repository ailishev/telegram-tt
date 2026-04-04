-- Prisma bootstrap migration for Neon-backed telegram-tt backend
CREATE TYPE "DialogType" AS ENUM ('saved', 'private', 'group', 'channel');

CREATE TABLE "Profile" (
  "id" TEXT PRIMARY KEY,
  "authIdentifier" TEXT UNIQUE,
  "phoneNumber" TEXT UNIQUE,
  "username" TEXT UNIQUE,
  "firstName" TEXT NOT NULL DEFAULT '',
  "lastName" TEXT NOT NULL DEFAULT '',
  "displayName" TEXT NOT NULL DEFAULT '',
  "bio" TEXT,
  "avatarUrl" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPremium" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Dialog" (
  "id" TEXT PRIMARY KEY,
  "type" "DialogType" NOT NULL,
  "title" TEXT,
  "avatarUrl" TEXT,
  "createdByProfileId" TEXT,
  "lastMessageId" TEXT,
  "lastMessagePreview" TEXT,
  "lastMessageAt" TIMESTAMPTZ,
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Dialog_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "Profile" ("id") ON DELETE SET NULL
);

CREATE TABLE "DialogMember" (
  "id" TEXT PRIMARY KEY,
  "dialogId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "DialogMember_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog" ("id") ON DELETE CASCADE,
  CONSTRAINT "DialogMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE,
  CONSTRAINT "DialogMember_dialogId_profileId_key" UNIQUE ("dialogId", "profileId")
);

CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY,
  "dialogId" TEXT NOT NULL,
  "senderProfileId" TEXT NOT NULL,
  "content" TEXT,
  "messageType" TEXT NOT NULL DEFAULT 'text',
  "replyToMessageId" TEXT,
  "serviceAction" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Message_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog" ("id") ON DELETE CASCADE,
  CONSTRAINT "Message_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
