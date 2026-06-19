-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LecturePlaylist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LecturePlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LecturePlaylist" ("createdAt", "id", "title", "url", "userId") SELECT "createdAt", "id", "title", "url", "userId" FROM "LecturePlaylist";
DROP TABLE "LecturePlaylist";
ALTER TABLE "new_LecturePlaylist" RENAME TO "LecturePlaylist";
CREATE INDEX "LecturePlaylist_userId_sortOrder_idx" ON "LecturePlaylist"("userId", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
