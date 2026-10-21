-- CreateTable
CREATE TABLE "DepartamentoPermissao" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,

    CONSTRAINT "DepartamentoPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoRefresh" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessaoRefresh_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartamentoPermissao_departamentoId_permissaoId_key" ON "DepartamentoPermissao"("departamentoId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoRefresh_tokenHash_key" ON "SessaoRefresh"("tokenHash");

-- CreateIndex
CREATE INDEX "SessaoRefresh_idEmpresa_usuarioId_idx" ON "SessaoRefresh"("idEmpresa", "usuarioId");

-- CreateIndex
CREATE INDEX "SessaoRefresh_expiraEm_idx" ON "SessaoRefresh"("expiraEm");

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_departamentoId_idEmpresa_fkey" FOREIGN KEY ("departamentoId", "idEmpresa") REFERENCES "Departamento"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRefresh" ADD CONSTRAINT "SessaoRefresh_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRefresh" ADD CONSTRAINT "SessaoRefresh_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;
