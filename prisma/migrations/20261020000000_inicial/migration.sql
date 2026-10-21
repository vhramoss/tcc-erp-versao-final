-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" TEXT,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "pessoaId" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "pessoaId" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "pessoaId" TEXT NOT NULL,
    "departamentoId" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPermissao" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProduto" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadeMedida" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnidadeMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "unidadeMedidaId" TEXT NOT NULL,
    "marcaId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sku" TEXT NOT NULL,
    "referencia" TEXT,
    "cor" TEXT,
    "precoCusto" DECIMAL(10,2) NOT NULL,
    "estoqueMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "alertaEstoqueAtivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoProduto" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeTabela" TEXT NOT NULL DEFAULT 'Padrão',
    "precoVenda" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Almoxarifado" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "almoxarifadoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "ultimaAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimento" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "qtdAnterior" DECIMAL(12,3) NOT NULL,
    "qtdModificada" DECIMAL(12,3) NOT NULL,
    "qtdPosterior" DECIMAL(12,3) NOT NULL,
    "observacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compraId" TEXT,

    CONSTRAINT "EstoqueMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPedido" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ehInicial" BOOLEAN NOT NULL DEFAULT false,
    "ehFinal" BOOLEAN NOT NULL DEFAULT false,
    "ehCancelamento" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusProduto" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "almoxarifadoId" TEXT NOT NULL,
    "formaPagamentoId" TEXT,
    "statusId" TEXT NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "statusId" TEXT,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "custoUnitario" DECIMAL(10,2) NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoContas" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoContas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCusto" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormaPagamento" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoFinanceira" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "pedidoId" TEXT,
    "planoContasId" TEXT,
    "centroCustoId" TEXT,
    "formaPagamentoId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "compraId" TEXT,

    CONSTRAINT "TransacaoFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "almoxarifadoId" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "acrescimos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notaNumero" TEXT,
    "notaSerie" TEXT,
    "notaChave" TEXT,
    "notaEmissao" TIMESTAMP(3),
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCompra" (
    "id" TEXT NOT NULL,
    "idEmpresa" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "valorUnitario" DECIMAL(21,10) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ItemCompra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_email_key" ON "Empresa"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_idEmpresa_cpfCnpj_key" ON "Pessoa"("idEmpresa", "cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_idEmpresa_email_key" ON "Pessoa"("idEmpresa", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_id_idEmpresa_key" ON "Pessoa"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_pessoaId_key" ON "Cliente"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_pessoaId_idEmpresa_key" ON "Cliente"("pessoaId", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_id_idEmpresa_key" ON "Cliente"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_pessoaId_key" ON "Fornecedor"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_pessoaId_idEmpresa_key" ON "Fornecedor"("pessoaId", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_id_idEmpresa_key" ON "Fornecedor"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_idEmpresa_nome_key" ON "Departamento"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_id_idEmpresa_key" ON "Departamento"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_pessoaId_key" ON "Usuario"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_idEmpresa_username_key" ON "Usuario"("idEmpresa", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_pessoaId_idEmpresa_key" ON "Usuario"("pessoaId", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_id_idEmpresa_key" ON "Usuario"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_nome_key" ON "Permissao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPermissao_usuarioId_permissaoId_key" ON "UsuarioPermissao"("usuarioId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProduto_id_idEmpresa_key" ON "CategoriaProduto"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_idEmpresa_nome_key" ON "Marca"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_id_idEmpresa_key" ON "Marca"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeMedida_idEmpresa_sigla_key" ON "UnidadeMedida"("idEmpresa", "sigla");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeMedida_id_idEmpresa_key" ON "UnidadeMedida"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_idEmpresa_sku_key" ON "Produto"("idEmpresa", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_id_idEmpresa_key" ON "Produto"("id", "idEmpresa");

-- CreateIndex
CREATE INDEX "PrecoProduto_idEmpresa_produtoId_idx" ON "PrecoProduto"("idEmpresa", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "PrecoProduto_idEmpresa_produtoId_nomeTabela_key" ON "PrecoProduto"("idEmpresa", "produtoId", "nomeTabela");

-- CreateIndex
CREATE UNIQUE INDEX "Almoxarifado_idEmpresa_nome_key" ON "Almoxarifado"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Almoxarifado_id_idEmpresa_key" ON "Almoxarifado"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_idEmpresa_almoxarifadoId_produtoId_key" ON "Estoque"("idEmpresa", "almoxarifadoId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_id_idEmpresa_key" ON "Estoque"("id", "idEmpresa");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_idEmpresa_estoqueId_createdAt_idx" ON "EstoqueMovimento"("idEmpresa", "estoqueId", "createdAt");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_pedidoId_idx" ON "EstoqueMovimento"("pedidoId");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_idEmpresa_compraId_idx" ON "EstoqueMovimento"("idEmpresa", "compraId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPedido_idEmpresa_nome_key" ON "StatusPedido"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPedido_id_idEmpresa_key" ON "StatusPedido"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "StatusProduto_idEmpresa_nome_key" ON "StatusProduto"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "StatusProduto_id_idEmpresa_key" ON "StatusProduto"("id", "idEmpresa");

-- CreateIndex
CREATE INDEX "Pedido_idEmpresa_dataPedido_idx" ON "Pedido"("idEmpresa", "dataPedido");

-- CreateIndex
CREATE INDEX "Pedido_idEmpresa_statusId_idx" ON "Pedido"("idEmpresa", "statusId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_id_idEmpresa_key" ON "Pedido"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_idEmpresa_referencia_key" ON "Pedido"("idEmpresa", "referencia");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPedido_idEmpresa_pedidoId_produtoId_key" ON "ItemPedido"("idEmpresa", "pedidoId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoContas_idEmpresa_codigo_key" ON "PlanoContas"("idEmpresa", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoContas_id_idEmpresa_key" ON "PlanoContas"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_id_idEmpresa_key" ON "CentroCusto"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "FormaPagamento_idEmpresa_nome_key" ON "FormaPagamento"("idEmpresa", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "FormaPagamento_id_idEmpresa_key" ON "FormaPagamento"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "TransacaoFinanceira_pedidoId_key" ON "TransacaoFinanceira"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "TransacaoFinanceira_compraId_key" ON "TransacaoFinanceira"("compraId");

-- CreateIndex
CREATE INDEX "TransacaoFinanceira_idEmpresa_dataVencimento_idx" ON "TransacaoFinanceira"("idEmpresa", "dataVencimento");

-- CreateIndex
CREATE INDEX "TransacaoFinanceira_idEmpresa_status_idx" ON "TransacaoFinanceira"("idEmpresa", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TransacaoFinanceira_pedidoId_idEmpresa_key" ON "TransacaoFinanceira"("pedidoId", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "TransacaoFinanceira_compraId_idEmpresa_key" ON "TransacaoFinanceira"("compraId", "idEmpresa");

-- CreateIndex
CREATE INDEX "Compra_idEmpresa_createdAt_idx" ON "Compra"("idEmpresa", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_id_idEmpresa_key" ON "Compra"("id", "idEmpresa");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_idEmpresa_referencia_key" ON "Compra"("idEmpresa", "referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_idEmpresa_notaChave_key" ON "Compra"("idEmpresa", "notaChave");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_idEmpresa_fornecedorId_notaNumero_notaSerie_key" ON "Compra"("idEmpresa", "fornecedorId", "notaNumero", "notaSerie");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCompra_idEmpresa_compraId_sequencia_key" ON "ItemCompra"("idEmpresa", "compraId", "sequencia");

-- AddForeignKey
ALTER TABLE "Pessoa" ADD CONSTRAINT "Pessoa_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_pessoaId_idEmpresa_fkey" FOREIGN KEY ("pessoaId", "idEmpresa") REFERENCES "Pessoa"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_pessoaId_idEmpresa_fkey" FOREIGN KEY ("pessoaId", "idEmpresa") REFERENCES "Pessoa"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_pessoaId_idEmpresa_fkey" FOREIGN KEY ("pessoaId", "idEmpresa") REFERENCES "Pessoa"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_departamentoId_idEmpresa_fkey" FOREIGN KEY ("departamentoId", "idEmpresa") REFERENCES "Departamento"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaProduto" ADD CONSTRAINT "CategoriaProduto_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marca" ADD CONSTRAINT "Marca_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadeMedida" ADD CONSTRAINT "UnidadeMedida_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_idEmpresa_fkey" FOREIGN KEY ("categoriaId", "idEmpresa") REFERENCES "CategoriaProduto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_unidadeMedidaId_idEmpresa_fkey" FOREIGN KEY ("unidadeMedidaId", "idEmpresa") REFERENCES "UnidadeMedida"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_marcaId_idEmpresa_fkey" FOREIGN KEY ("marcaId", "idEmpresa") REFERENCES "Marca"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoProduto" ADD CONSTRAINT "PrecoProduto_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoProduto" ADD CONSTRAINT "PrecoProduto_produtoId_idEmpresa_fkey" FOREIGN KEY ("produtoId", "idEmpresa") REFERENCES "Produto"("id", "idEmpresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Almoxarifado" ADD CONSTRAINT "Almoxarifado_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_almoxarifadoId_idEmpresa_fkey" FOREIGN KEY ("almoxarifadoId", "idEmpresa") REFERENCES "Almoxarifado"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_produtoId_idEmpresa_fkey" FOREIGN KEY ("produtoId", "idEmpresa") REFERENCES "Produto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_estoqueId_idEmpresa_fkey" FOREIGN KEY ("estoqueId", "idEmpresa") REFERENCES "Estoque"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_pedidoId_idEmpresa_fkey" FOREIGN KEY ("pedidoId", "idEmpresa") REFERENCES "Pedido"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_compraId_idEmpresa_fkey" FOREIGN KEY ("compraId", "idEmpresa") REFERENCES "Compra"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPedido" ADD CONSTRAINT "StatusPedido_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusProduto" ADD CONSTRAINT "StatusProduto_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_idEmpresa_fkey" FOREIGN KEY ("clienteId", "idEmpresa") REFERENCES "Cliente"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_almoxarifadoId_idEmpresa_fkey" FOREIGN KEY ("almoxarifadoId", "idEmpresa") REFERENCES "Almoxarifado"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_formaPagamentoId_idEmpresa_fkey" FOREIGN KEY ("formaPagamentoId", "idEmpresa") REFERENCES "FormaPagamento"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_statusId_idEmpresa_fkey" FOREIGN KEY ("statusId", "idEmpresa") REFERENCES "StatusPedido"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_idEmpresa_fkey" FOREIGN KEY ("pedidoId", "idEmpresa") REFERENCES "Pedido"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_idEmpresa_fkey" FOREIGN KEY ("produtoId", "idEmpresa") REFERENCES "Produto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_statusId_idEmpresa_fkey" FOREIGN KEY ("statusId", "idEmpresa") REFERENCES "StatusProduto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoContas" ADD CONSTRAINT "PlanoContas_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentroCusto" ADD CONSTRAINT "CentroCusto_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormaPagamento" ADD CONSTRAINT "FormaPagamento_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_pedidoId_idEmpresa_fkey" FOREIGN KEY ("pedidoId", "idEmpresa") REFERENCES "Pedido"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_planoContasId_idEmpresa_fkey" FOREIGN KEY ("planoContasId", "idEmpresa") REFERENCES "PlanoContas"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_centroCustoId_idEmpresa_fkey" FOREIGN KEY ("centroCustoId", "idEmpresa") REFERENCES "CentroCusto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_formaPagamentoId_idEmpresa_fkey" FOREIGN KEY ("formaPagamentoId", "idEmpresa") REFERENCES "FormaPagamento"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_compraId_idEmpresa_fkey" FOREIGN KEY ("compraId", "idEmpresa") REFERENCES "Compra"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_fornecedorId_idEmpresa_fkey" FOREIGN KEY ("fornecedorId", "idEmpresa") REFERENCES "Fornecedor"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_almoxarifadoId_idEmpresa_fkey" FOREIGN KEY ("almoxarifadoId", "idEmpresa") REFERENCES "Almoxarifado"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_compraId_idEmpresa_fkey" FOREIGN KEY ("compraId", "idEmpresa") REFERENCES "Compra"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_produtoId_idEmpresa_fkey" FOREIGN KEY ("produtoId", "idEmpresa") REFERENCES "Produto"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;
