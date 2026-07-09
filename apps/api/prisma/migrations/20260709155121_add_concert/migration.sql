-- CreateTable
CREATE TABLE "concerts" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concerts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
