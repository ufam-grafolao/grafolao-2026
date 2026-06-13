-- AddForeignKey
ALTER TABLE "comunidades" ADD CONSTRAINT "comunidades_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_comunidade" ADD CONSTRAINT "convites_comunidade_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
