-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "videoId" TEXT;

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "playbackKey" TEXT,
    "playbackUrl" TEXT,
    "posterKey" TEXT,
    "posterUrl" TEXT,
    "durationSeconds" INTEGER,
    "status" "VideoStatus" NOT NULL DEFAULT 'PROCESSING',
    "concertId" TEXT,
    "postId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_postId_key" ON "videos"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporterId_videoId_key" ON "reports"("reporterId", "videoId");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_concertId_fkey" FOREIGN KEY ("concertId") REFERENCES "concerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

