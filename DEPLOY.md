# 🚀 Guia de Deploy no Railway

Este guia detalha o processo completo para fazer deploy do PDV_RUST_SQLITE no Railway.

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Repositório no GitHub
- Código commitado e pushed

## 🏗️ Arquitetura de Deploy

O projeto será deployado em **2 serviços separados**:

1. **Backend** (Rust API) - Porta 3000
2. **Frontend** (React SPA) - Porta 80

```
┌─────────────────────────────────────────┐
│         Railway Project                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │   Backend    │   │   Frontend    │  │
│  │  (Rust API)  │◄──┤  (React SPA)  │  │
│  │              │   │               │  │
│  │  Port: 3000  │   │   Port: 80    │  │
│  └──────────────┘   └───────────────┘  │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │   SQLite DB  │                      │
│  │  (Volume)    │                      │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

## 🔧 Passo 1: Preparar o Repositório

### 1.1 Verificar Arquivos de Deploy

Certifique-se de que os seguintes arquivos existem:

```bash
# Backend
backend/Dockerfile
backend/.dockerignore
backend/.env.example

# Frontend
frontend/Dockerfile
frontend/.dockerignore
frontend/nginx.conf
frontend/.env.example

# Root
railway.json
```

### 1.2 Commit e Push

```bash
git add .
git commit -m "feat: Add Railway deployment configuration"
git push origin main
```

## 🚂 Passo 2: Criar Projeto no Railway

### 2.1 Acessar Railway

1. Acesse [railway.app](https://railway.app/)
2. Faça login com GitHub
3. Clique em **"New Project"**

### 2.2 Conectar Repositório

1. Selecione **"Deploy from GitHub repo"**
2. Escolha o repositório `PDV_RUST_SQLITE`
3. Autorize o Railway a acessar o repositório

## 🔨 Passo 3: Configurar Backend

### 3.1 Criar Serviço Backend

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Escolha o repositório novamente
4. Configure:
   - **Service Name**: `backend`
   - **Root Directory**: `backend`
   - **Builder**: Docker

### 3.2 Configurar Variáveis de Ambiente

Vá em **Variables** e adicione:

```env
DATABASE_URL=sqlite:/app/pdv.db
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-IN-PRODUCTION
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
PORT=3000
RUST_LOG=info
```

> **⚠️ IMPORTANTE**: Gere um JWT_SECRET seguro:
> ```bash
> openssl rand -base64 32
> ```

### 3.3 Configurar Volume (Persistência do SQLite)

1. Vá em **Settings** > **Volumes**
2. Clique em **"+ Add Volume"**
3. Configure:
   - **Mount Path**: `/app`
   - **Size**: 1 GB

### 3.4 Gerar Domínio Público

1. Vá em **Settings** > **Networking**
2. Clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `backend-production-xxxx.up.railway.app`)

## 🎨 Passo 4: Configurar Frontend

### 4.1 Criar Serviço Frontend

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Escolha o repositório novamente
4. Configure:
   - **Service Name**: `frontend`
   - **Root Directory**: `frontend`
   - **Builder**: Docker

### 4.2 Configurar Variáveis de Ambiente

Vá em **Variables** e adicione:

```env
VITE_API_URL=https://backend-production-xxxx.up.railway.app
```

> **📝 NOTA**: Substitua pela URL real do backend gerada no passo 3.4

### 4.3 Gerar Domínio Público

1. Vá em **Settings** > **Networking**
2. Clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `frontend-production-xxxx.up.railway.app`)

### 4.4 Atualizar CORS no Backend

Volte nas variáveis do **backend** e atualize:

```env
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
```

## 🚀 Passo 5: Deploy

### 5.1 Trigger Deploy

Os deploys acontecem automaticamente quando você faz push para o GitHub. Para forçar um redeploy:

1. Vá no serviço (backend ou frontend)
2. Clique em **Deployments**
3. Clique em **"Redeploy"**

### 5.2 Monitorar Logs

Acompanhe o build em tempo real:

1. Clique no deployment ativo
2. Veja os logs de build
3. Aguarde até ver: `✅ Connected to database` (backend) ou `Build completed` (frontend)

## ✅ Passo 6: Verificação

### 6.1 Testar Backend

```bash
# Health check
curl https://backend-production-xxxx.up.railway.app/

# Deve retornar: "Hello, SaaS PDV!"
```

### 6.2 Testar Frontend

1. Acesse a URL do frontend no navegador
2. Tente fazer login (se já tiver usuário)
3. Ou registre um novo usuário

### 6.3 Criar Usuário Admin (Opcional)

Se precisar criar um admin master via CLI:

```bash
# No Railway, vá em Settings > Deploy Logs
# Encontre o container ID e execute:
railway run --service backend cargo run --bin create_admin
```

## 🔧 Configurações Adicionais

### Custom Domain (Opcional)

1. Vá em **Settings** > **Networking**
2. Clique em **"Custom Domain"**
3. Adicione seu domínio (ex: `api.meupdv.com`)
4. Configure DNS conforme instruções

### Monitoramento

Railway oferece métricas automáticas:
- CPU usage
- Memory usage
- Network traffic
- Request logs

Acesse em **Metrics** no dashboard do serviço.

### Backups

Para fazer backup do banco SQLite:

```bash
# Conecte via Railway CLI
railway connect backend

# Copie o arquivo do banco
cp /app/pdv.db /tmp/backup.db

# Download local
railway volume download /tmp/backup.db
```

## 🐛 Troubleshooting

### Build Falha no Backend

**Erro**: `Failed to compile`

**Solução**:
```bash
# Teste localmente primeiro
cd backend
docker build -t pdv-backend .
```

### Frontend não conecta ao Backend

**Erro**: `Network Error` ou `CORS`

**Solução**:
1. Verifique se `VITE_API_URL` está correto
2. Verifique se `FRONTEND_URL` no backend está correto
3. Redeploy ambos os serviços

### Banco de Dados Vazio

**Erro**: `Table not found`

**Solução**:
```bash
# As migrations devem rodar automaticamente
# Se não rodaram, force via Railway CLI:
railway connect backend
cd /app
sqlx migrate run
```

### Porta Incorreta

**Erro**: `Address already in use`

**Solução**:
- Railway define `PORT` automaticamente
- Certifique-se de que o código lê `env::var("PORT")`

## 📊 Custos Estimados

### Hobby Plan (Gratuito)
- $5 de crédito/mês
- 2 serviços + volume = ~$3-4/mês
- ✅ Suficiente para desenvolvimento e testes

### Developer Plan ($20/mês)
- $20 de crédito incluído
- Melhor para produção
- Suporte prioritário

## 🔐 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET gerado aleatoriamente
- [ ] Variáveis sensíveis não commitadas no Git
- [ ] CORS configurado corretamente
- [ ] HTTPS habilitado (Railway faz automaticamente)
- [ ] Senhas hasheadas com Argon2
- [ ] Logs não expõem dados sensíveis

## 📚 Recursos Úteis

- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Rust on Railway](https://docs.railway.app/guides/rust)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🎉 Conclusão

Após seguir todos os passos, você terá:

✅ Backend Rust rodando em produção  
✅ Frontend React acessível publicamente  
✅ Banco de dados SQLite persistente  
✅ CORS configurado corretamente  
✅ Deploy automático via Git push  

**URLs Finais:**
- Backend: `https://backend-production-xxxx.up.railway.app`
- Frontend: `https://frontend-production-xxxx.up.railway.app`

---

**Criado em**: 16/12/2025  
**Versão**: 1.0
