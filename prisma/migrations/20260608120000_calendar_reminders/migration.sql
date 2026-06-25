-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TASK_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TASK_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ROLE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_UPCOMING';

-- CreateEnum
CREATE TYPE "ReminderOffsetType" AS ENUM ('ONE_DAY_BEFORE', 'THREE_HOURS_BEFORE', 'ONE_HOUR_BEFORE', 'CUSTOM');
CREATE TYPE "ReminderTargetType" AS ENUM ('TASK', 'EVENT');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "relatedEventId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupeKey_key" ON "notifications"("dedupeKey");
CREATE INDEX IF NOT EXISTS "notifications_dedupeKey_idx" ON "notifications"("dedupeKey");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedEventId_fkey" FOREIGN KEY ("relatedEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "ReminderTargetType" NOT NULL,
    "taskId" TEXT,
    "eventId" TEXT,
    "offsetType" "ReminderOffsetType" NOT NULL,
    "customAt" TIMESTAMP(3),
    "remindAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reminders_dedupeKey_key" ON "reminders"("dedupeKey");
CREATE INDEX IF NOT EXISTS "reminders_userId_idx" ON "reminders"("userId");
CREATE INDEX IF NOT EXISTS "reminders_remindAt_sentAt_idx" ON "reminders"("remindAt", "sentAt");
CREATE INDEX IF NOT EXISTS "reminders_taskId_idx" ON "reminders"("taskId");
CREATE INDEX IF NOT EXISTS "reminders_eventId_idx" ON "reminders"("eventId");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
