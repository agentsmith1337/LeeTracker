-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RevisionCategory" AS ENUM ('CODING', 'RIDDLE', 'QUANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "RevisionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "platform" TEXT,
    "revisionDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturePlaylist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LecturePlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureVideo" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "videoId" TEXT,
    "url" TEXT,
    "thumbnailPath" TEXT,
    "watched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LectureVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Revision_userId_revisionDate_idx" ON "Revision"("userId", "revisionDate");

-- CreateIndex
CREATE INDEX "Revision_userId_category_idx" ON "Revision"("userId", "category");

-- CreateIndex
CREATE INDEX "LecturePlaylist_userId_sortOrder_idx" ON "LecturePlaylist"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "LectureVideo_playlistId_position_idx" ON "LectureVideo"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturePlaylist" ADD CONSTRAINT "LecturePlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureVideo" ADD CONSTRAINT "LectureVideo_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "LecturePlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;