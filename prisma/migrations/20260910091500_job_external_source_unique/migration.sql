-- Postgres unique indexes treat NULL as distinct, so this is safe even
-- though many existing "careeros"-sourced jobs share a NULL externalId.
CREATE UNIQUE INDEX "jobs_source_externalId_key" ON "jobs"("source", "externalId");
