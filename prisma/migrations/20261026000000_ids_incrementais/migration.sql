-- Conversao para IDs inteiros: exige tabelas vazias. Nao apaga dados existentes.
BEGIN;
LOCK TABLE "Empresa", "Pessoa", "Cliente", "Fornecedor", "Departamento", "Usuario", "Permissao", "UsuarioPermissao", "DepartamentoPermissao", "SessaoRefresh", "CategoriaProduto", "Marca", "UnidadeMedida", "Produto", "PrecoProduto", "Almoxarifado", "Estoque", "EstoqueMovimento", "StatusPedido", "StatusProduto", "Pedido", "ItemPedido", "PlanoContas", "CentroCusto", "FormaPagamento", "TransacaoFinanceira", "Compra", "ItemCompra" IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Empresa") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Pessoa") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Cliente") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Fornecedor") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Departamento") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Usuario") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Permissao") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "UsuarioPermissao") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "DepartamentoPermissao") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "SessaoRefresh") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "CategoriaProduto") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Marca") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "UnidadeMedida") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Produto") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "PrecoProduto") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Almoxarifado") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Estoque") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "EstoqueMovimento") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "StatusPedido") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "StatusProduto") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Pedido") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "ItemPedido") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "PlanoContas") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "CentroCusto") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "FormaPagamento") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "TransacaoFinanceira") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Compra") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
  IF EXISTS (SELECT 1 FROM "ItemCompra") THEN
    RAISE EXCEPTION 'IDs incrementais: banco deve estar vazio. Recrie o banco de desenvolvimento conforme docs/ids-incrementais.md.';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "Pessoa" DROP CONSTRAINT "Pessoa_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pessoaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Fornecedor" DROP CONSTRAINT "Fornecedor_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Fornecedor" DROP CONSTRAINT "Fornecedor_pessoaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Departamento" DROP CONSTRAINT "Departamento_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_pessoaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_departamentoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioPermissao" DROP CONSTRAINT "UsuarioPermissao_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioPermissao" DROP CONSTRAINT "UsuarioPermissao_usuarioId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioPermissao" DROP CONSTRAINT "UsuarioPermissao_permissaoId_fkey";

-- DropForeignKey
ALTER TABLE "DepartamentoPermissao" DROP CONSTRAINT "DepartamentoPermissao_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "DepartamentoPermissao" DROP CONSTRAINT "DepartamentoPermissao_departamentoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "DepartamentoPermissao" DROP CONSTRAINT "DepartamentoPermissao_permissaoId_fkey";

-- DropForeignKey
ALTER TABLE "SessaoRefresh" DROP CONSTRAINT "SessaoRefresh_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "SessaoRefresh" DROP CONSTRAINT "SessaoRefresh_usuarioId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "CategoriaProduto" DROP CONSTRAINT "CategoriaProduto_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Marca" DROP CONSTRAINT "Marca_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "UnidadeMedida" DROP CONSTRAINT "UnidadeMedida_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_categoriaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_unidadeMedidaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_marcaId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "PrecoProduto" DROP CONSTRAINT "PrecoProduto_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "PrecoProduto" DROP CONSTRAINT "PrecoProduto_produtoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Almoxarifado" DROP CONSTRAINT "Almoxarifado_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_almoxarifadoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_produtoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_estoqueId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_usuarioId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_pedidoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_compraId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "StatusPedido" DROP CONSTRAINT "StatusPedido_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "StatusProduto" DROP CONSTRAINT "StatusProduto_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_clienteId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_usuarioId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_almoxarifadoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_formaPagamentoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_statusId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_pedidoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_produtoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_statusId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "PlanoContas" DROP CONSTRAINT "PlanoContas_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "CentroCusto" DROP CONSTRAINT "CentroCusto_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "FormaPagamento" DROP CONSTRAINT "FormaPagamento_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_pedidoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_planoContasId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_centroCustoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_formaPagamentoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_compraId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_fornecedorId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_usuarioId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_almoxarifadoId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemCompra" DROP CONSTRAINT "ItemCompra_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemCompra" DROP CONSTRAINT "ItemCompra_compraId_idEmpresa_fkey";

-- DropForeignKey
ALTER TABLE "ItemCompra" DROP CONSTRAINT "ItemCompra_produtoId_idEmpresa_fkey";

-- AlterTable
ALTER TABLE "Empresa" DROP CONSTRAINT "Empresa_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Pessoa" DROP CONSTRAINT "Pessoa_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "pessoaId",
ADD COLUMN     "pessoaId" INTEGER NOT NULL,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Fornecedor" DROP CONSTRAINT "Fornecedor_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "pessoaId",
ADD COLUMN     "pessoaId" INTEGER NOT NULL,
ADD CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Departamento" DROP CONSTRAINT "Departamento_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "pessoaId",
ADD COLUMN     "pessoaId" INTEGER NOT NULL,
DROP COLUMN "departamentoId",
ADD COLUMN     "departamentoId" INTEGER,
ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Permissao" DROP CONSTRAINT "Permissao_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UsuarioPermissao" DROP CONSTRAINT "UsuarioPermissao_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
DROP COLUMN "permissaoId",
ADD COLUMN     "permissaoId" INTEGER NOT NULL,
ADD CONSTRAINT "UsuarioPermissao_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DepartamentoPermissao" DROP CONSTRAINT "DepartamentoPermissao_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "departamentoId",
ADD COLUMN     "departamentoId" INTEGER NOT NULL,
DROP COLUMN "permissaoId",
ADD COLUMN     "permissaoId" INTEGER NOT NULL,
ADD CONSTRAINT "DepartamentoPermissao_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SessaoRefresh" DROP CONSTRAINT "SessaoRefresh_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
ADD CONSTRAINT "SessaoRefresh_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CategoriaProduto" DROP CONSTRAINT "CategoriaProduto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "CategoriaProduto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Marca" DROP CONSTRAINT "Marca_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "Marca_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UnidadeMedida" DROP CONSTRAINT "UnidadeMedida_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "UnidadeMedida_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "categoriaId",
ADD COLUMN     "categoriaId" INTEGER NOT NULL,
DROP COLUMN "unidadeMedidaId",
ADD COLUMN     "unidadeMedidaId" INTEGER NOT NULL,
DROP COLUMN "marcaId",
ADD COLUMN     "marcaId" INTEGER,
ADD CONSTRAINT "Produto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PrecoProduto" DROP CONSTRAINT "PrecoProduto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "produtoId",
ADD COLUMN     "produtoId" INTEGER NOT NULL,
ADD CONSTRAINT "PrecoProduto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Almoxarifado" DROP CONSTRAINT "Almoxarifado_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "Almoxarifado_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "almoxarifadoId",
ADD COLUMN     "almoxarifadoId" INTEGER NOT NULL,
DROP COLUMN "produtoId",
ADD COLUMN     "produtoId" INTEGER NOT NULL,
ADD CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "EstoqueMovimento" DROP CONSTRAINT "EstoqueMovimento_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "estoqueId",
ADD COLUMN     "estoqueId" INTEGER NOT NULL,
DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
DROP COLUMN "pedidoId",
ADD COLUMN     "pedidoId" INTEGER,
DROP COLUMN "compraId",
ADD COLUMN     "compraId" INTEGER,
ADD CONSTRAINT "EstoqueMovimento_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StatusPedido" DROP CONSTRAINT "StatusPedido_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "StatusPedido_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StatusProduto" DROP CONSTRAINT "StatusProduto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "StatusProduto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "clienteId",
ADD COLUMN     "clienteId" INTEGER NOT NULL,
DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
DROP COLUMN "almoxarifadoId",
ADD COLUMN     "almoxarifadoId" INTEGER NOT NULL,
DROP COLUMN "formaPagamentoId",
ADD COLUMN     "formaPagamentoId" INTEGER,
DROP COLUMN "statusId",
ADD COLUMN     "statusId" INTEGER NOT NULL,
ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "pedidoId",
ADD COLUMN     "pedidoId" INTEGER NOT NULL,
DROP COLUMN "produtoId",
ADD COLUMN     "produtoId" INTEGER NOT NULL,
DROP COLUMN "statusId",
ADD COLUMN     "statusId" INTEGER,
ADD CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PlanoContas" DROP CONSTRAINT "PlanoContas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "PlanoContas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CentroCusto" DROP CONSTRAINT "CentroCusto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FormaPagamento" DROP CONSTRAINT "FormaPagamento_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
ADD CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TransacaoFinanceira" DROP CONSTRAINT "TransacaoFinanceira_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "pedidoId",
ADD COLUMN     "pedidoId" INTEGER,
DROP COLUMN "planoContasId",
ADD COLUMN     "planoContasId" INTEGER,
DROP COLUMN "centroCustoId",
ADD COLUMN     "centroCustoId" INTEGER,
DROP COLUMN "formaPagamentoId",
ADD COLUMN     "formaPagamentoId" INTEGER,
DROP COLUMN "compraId",
ADD COLUMN     "compraId" INTEGER,
ADD CONSTRAINT "TransacaoFinanceira_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "fornecedorId",
ADD COLUMN     "fornecedorId" INTEGER NOT NULL,
DROP COLUMN "usuarioId",
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
DROP COLUMN "almoxarifadoId",
ADD COLUMN     "almoxarifadoId" INTEGER NOT NULL,
ADD CONSTRAINT "Compra_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ItemCompra" DROP CONSTRAINT "ItemCompra_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "idEmpresa",
ADD COLUMN     "idEmpresa" INTEGER NOT NULL,
DROP COLUMN "compraId",
ADD COLUMN     "compraId" INTEGER NOT NULL,
DROP COLUMN "produtoId",
ADD COLUMN     "produtoId" INTEGER NOT NULL,
ADD CONSTRAINT "ItemCompra_pkey" PRIMARY KEY ("id");

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
CREATE UNIQUE INDEX "UsuarioPermissao_usuarioId_permissaoId_key" ON "UsuarioPermissao"("usuarioId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartamentoPermissao_departamentoId_permissaoId_key" ON "DepartamentoPermissao"("departamentoId", "permissaoId");

-- CreateIndex
CREATE INDEX "SessaoRefresh_idEmpresa_usuarioId_idx" ON "SessaoRefresh"("idEmpresa", "usuarioId");

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
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_departamentoId_idEmpresa_fkey" FOREIGN KEY ("departamentoId", "idEmpresa") REFERENCES "Departamento"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartamentoPermissao" ADD CONSTRAINT "DepartamentoPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRefresh" ADD CONSTRAINT "SessaoRefresh_idEmpresa_fkey" FOREIGN KEY ("idEmpresa") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoRefresh" ADD CONSTRAINT "SessaoRefresh_usuarioId_idEmpresa_fkey" FOREIGN KEY ("usuarioId", "idEmpresa") REFERENCES "Usuario"("id", "idEmpresa") ON DELETE RESTRICT ON UPDATE CASCADE;

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

COMMIT;
