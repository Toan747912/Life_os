/*
  Warnings:

  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'VIETNAMESE', 'JAPANESE', 'KOREAN', 'CHINESE', 'FRENCH', 'GERMAN', 'SPANISH');

-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'SENTENCE';

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_active_date" TIMESTAMP(3),
ADD COLUMN     "longest_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "Task";

-- CreateTable
CREATE TABLE "dictations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_id" TEXT,
    "title" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "sentences" JSONB NOT NULL DEFAULT '[]',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "language" "Language" NOT NULL DEFAULT 'ENGLISH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictation_attempts" (
    "id" TEXT NOT NULL,
    "dictation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "learning_item_id" TEXT,
    "original_text" TEXT NOT NULL,
    "user_input" TEXT NOT NULL,
    "accuracy_score" DOUBLE PRECISION NOT NULL,
    "levenshtein_dist" INTEGER NOT NULL,
    "time_spent" INTEGER NOT NULL,
    "error_details" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dictation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT NOT NULL,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dictation_attempts_dictation_id_idx" ON "dictation_attempts"("dictation_id");

-- CreateIndex
CREATE INDEX "dictation_attempts_user_id_idx" ON "dictation_attempts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_user_id_action_date_key" ON "activity_logs"("user_id", "action", "date");

-- AddForeignKey
ALTER TABLE "dictations" ADD CONSTRAINT "dictations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictations" ADD CONSTRAINT "dictations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictation_attempts" ADD CONSTRAINT "dictation_attempts_dictation_id_fkey" FOREIGN KEY ("dictation_id") REFERENCES "dictations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictation_attempts" ADD CONSTRAINT "dictation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictation_attempts" ADD CONSTRAINT "dictation_attempts_learning_item_id_fkey" FOREIGN KEY ("learning_item_id") REFERENCES "learning_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
