# 🔄 Migração SQLite → PostgreSQL - Concluída

## 📋 Resumo

Migrei completamente o banco de dados do projeto de **SQLite** para **PostgreSQL**, preparando o sistema para produção no Railway.

---

## ✅ Alterações Realizadas

### 1. Migrations Convertidas (11 arquivos)

Todas as migrations foram convertidas de SQLite para PostgreSQL com as seguintes melhorias:

#### Mudanças de Tipos de Dados

| SQLite | PostgreSQL | Motivo |
|--------|------------|--------|
| `TEXT` (IDs) | `UUID` | IDs únicos globais, melhor performance |
| `TEXT` (strings) | `VARCHAR(n)` | Limite de tamanho, validação |
| `DATETIME` | `TIMESTAMP` | Tipo nativo PostgreSQL |
| `TEXT` (JSON) | `JSONB` | Indexação e queries em JSON |
| `INTEGER` (grandes valores) | `BIGINT` | Suporte a valores maiores |

#### Melhorias Adicionadas

**Índices para Performance:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
-- ... e mais 10+ índices
```

**Foreign Keys com Cascade:**
```sql
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
```

**Trigger Auto-Update:**
```sql
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**UUID Auto-Geração:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

### 2. Código Backend Atualizado

#### [main.rs](file:///home/hendel/Projetos/Rust/PDV_Rust/backend/src/main.rs)
```rust
// Antes
use sqlx::sqlite::SqlitePoolOptions;
let pool = SqlitePoolOptions::new()

// Depois
use sqlx::postgres::PgPoolOptions;
let pool = PgPoolOptions::new()
```

#### Todos os Handlers (6 arquivos)
- `auth.rs`
- `admin.rs`
- `products.rs`
- `sales.rs`
- `customers.rs`
- `metrics.rs`

```rust
// Antes
use sqlx::SqlitePool;
State(pool): State<SqlitePool>

// Depois
use sqlx::PgPool;
State(pool): State<PgPool>
```

#### Binários Utilitários (2 arquivos)
- `create_admin.rs`
- `reset.rs`

Atualizados para usar `PgPoolOptions`.

---

### 3. Arquivos de Configuração

#### [.env.example](file:///home/hendel/Projetos/Rust/PDV_Rust/backend/.env.example)
```env
# Antes
DATABASE_URL=sqlite:pdv.db

# Depois
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### [Cargo.toml](file:///home/hendel/Projetos/Rust/PDV_Rust/backend/Cargo.toml)
```toml
# Já tinha suporte a postgres adicionado anteriormente
sqlx = { version = "0.8.6", features = ["runtime-tokio", "sqlite", "postgres", "chrono"] }
```

---

## 🗄️ Estrutura do Banco PostgreSQL

### Tabelas Criadas

1. **users** - Usuários do sistema
   - UUID como PK
   - Índices em email e tenant_id
   
2. **tenants** - Lojas/Tenants
   - UUID como PK
   - JSONB para custom_fields
   - Trigger para updated_at
   
3. **plans** - Planos SaaS
   - UUID como PK
   - JSONB para features
   
4. **products** - Produtos
   - UUID como PK
   - Índices em tenant_id e SKU
   - CASCADE delete
   
5. **customers** - Clientes
   - UUID como PK
   - Índices em tenant_id e email
   
6. **sales** - Vendas
   - UUID como PK
   - BIGINT para total_amount
   - Índices em tenant_id, user_id, created_at
   
7. **sale_items** - Itens de venda
   - UUID como PK
   - Índices em sale_id e product_id

---

## 🚀 Como Usar

### Desenvolvimento Local

#### 1. Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

#### 2. Criar Banco de Dados
```bash
# Conectar ao PostgreSQL
psql postgres

# Criar banco e usuário
CREATE DATABASE pdv_dev;
CREATE USER pdv_user WITH PASSWORD 'pdv_password';
GRANT ALL PRIVILEGES ON DATABASE pdv_dev TO pdv_user;
\q
```

#### 3. Configurar .env
```bash
cd backend
cp .env.example .env

# Editar .env
DATABASE_URL=postgresql://pdv_user:pdv_password@localhost:5432/pdv_dev
JWT_SECRET=<gerar-com-openssl>
RUST_LOG=debug
```

#### 4. Rodar Migrations
```bash
cargo install sqlx-cli --no-default-features --features postgres

sqlx database create
sqlx migrate run
```

#### 5. Executar Backend
```bash
cargo run
```

---

### Produção (Railway)

#### 1. Adicionar PostgreSQL no Railway
1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database" → "PostgreSQL"**
3. Railway criará automaticamente e injetará `DATABASE_URL`

#### 2. Variáveis de Ambiente
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-injetado
JWT_SECRET=<gerar-seguro>
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
PORT=3000
RUST_LOG=info
```

#### 3. Deploy
- Push para GitHub
- Railway fará build e deploy automaticamente
- Migrations rodarão automaticamente no primeiro deploy

---

## 🔍 Diferenças SQLite vs PostgreSQL

### Vantagens do PostgreSQL

| Recurso | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concorrência** | Limitada | Excelente |
| **Escalabilidade** | Arquivo local | Servidor dedicado |
| **Tipos de Dados** | 5 tipos básicos | 40+ tipos nativos |
| **JSON** | TEXT | JSONB (indexável) |
| **Foreign Keys** | Opcional | Nativo e robusto |
| **Triggers** | Básico | Avançado (PL/pgSQL) |
| **Índices** | Básico | Avançado (GIN, GiST, etc) |
| **Backup** | Copiar arquivo | pg_dump, replicação |
| **Produção** | ❌ Não recomendado | ✅ Recomendado |

### Compatibilidade de Queries

A maioria das queries SQLx são compatíveis, mas algumas mudanças:

```rust
// UUID geração (antes manual, agora automático)
// Antes (SQLite)
let id = uuid::Uuid::new_v4().to_string();

// Depois (PostgreSQL)
// UUID gerado automaticamente pelo banco
// Ou usar uuid::Uuid diretamente (tipo nativo)
```

---

## ✅ Checklist de Verificação

### Migrations
- [x] 11 migrations convertidas
- [x] Tipos de dados atualizados
- [x] UUIDs implementados
- [x] Índices adicionados
- [x] Foreign keys com CASCADE
- [x] Triggers criados
- [x] JSONB para campos JSON

### Código
- [x] main.rs atualizado
- [x] 6 handlers atualizados
- [x] 2 binários utilitários atualizados
- [x] Imports corrigidos

### Configuração
- [x] .env.example atualizado
- [x] Cargo.toml com postgres feature
- [x] Documentação atualizada

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
**Causa**: Migrations não rodaram  
**Solução**:
```bash
sqlx migrate run
```

### Erro: "password authentication failed"
**Causa**: Credenciais incorretas no DATABASE_URL  
**Solução**: Verificar usuário e senha no .env

### Erro: "could not connect to server"
**Causa**: PostgreSQL não está rodando  
**Solução**:
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql
```

### Erro: "uuid-ossp extension not found"
**Causa**: Extension UUID não instalada  
**Solução**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Ou usar gen_random_uuid() (PostgreSQL 13+)
```

---

## 📊 Impacto da Migração

### Performance
- ✅ Queries mais rápidas com índices otimizados
- ✅ JSONB permite queries em campos JSON
- ✅ Melhor concorrência (múltiplos usuários)

### Escalabilidade
- ✅ Suporta milhares de conexões simultâneas
- ✅ Replicação e backup nativos
- ✅ Particionamento de tabelas (futuro)

### Manutenção
- ✅ Ferramentas profissionais (pgAdmin, DBeaver)
- ✅ Monitoramento avançado
- ✅ Logs detalhados

---

## 🔄 Rollback (se necessário)

Para voltar ao SQLite (desenvolvimento local):

1. Reverter migrations:
```bash
git checkout HEAD~1 backend/migrations/
```

2. Reverter código:
```bash
sed -i 's/PgPool/SqlitePool/g' src/**/*.rs
sed -i 's/postgres::PgPoolOptions/sqlite::SqlitePoolOptions/g' src/bin/*.rs
```

3. Atualizar .env:
```env
DATABASE_URL=sqlite:pdv.db
```

---

**Status**: ✅ **Migração Completa**  
**Data**: 16/12/2025 23:45  
**Banco**: PostgreSQL  
**Pronto para**: Produção no Railway 🚀
