# ✅ Railway Deployment - Checklist

## 📦 Arquivos Criados

### Backend
- [x] `backend/Dockerfile` - Multi-stage build otimizado
- [x] `backend/.dockerignore` - Exclusões de build
- [x] `backend/.env.example` - Template de variáveis

### Frontend
- [x] `frontend/Dockerfile` - Build React + Nginx
- [x] `frontend/.dockerignore` - Exclusões de build
- [x] `frontend/nginx.conf` - Configuração SPA
- [x] `frontend/.env.example` - Template de variáveis

### Root
- [x] `railway.json` - Configuração Railway
- [x] `DEPLOY.md` - Guia completo de deploy

## 🔧 Modificações no Código

### Backend (`src/main.rs`)
- [x] Porta dinâmica via `PORT` env var
- [x] Bind em `0.0.0.0` (aceita conexões externas)
- [x] CORS permissivo configurado
- [x] Logging melhorado

### Frontend (`src/lib/api.ts`)
- [x] API URL via `VITE_API_URL` env var
- [x] Fallback para localhost em dev

### Dependencies (`Cargo.toml`)
- [x] PostgreSQL support adicionado (opcional)

## 🚀 Próximos Passos

### 1. Commit e Push
```bash
git add .
git commit -m "feat: Add Railway deployment configuration"
git push origin main
```

### 2. Criar Projeto no Railway
1. Acesse railway.app
2. New Project → Deploy from GitHub
3. Selecione o repositório

### 3. Configurar Backend Service
- **Root Directory**: `backend`
- **Builder**: Docker
- **Variáveis**:
  ```
  DATABASE_URL=sqlite:/app/pdv.db
  JWT_SECRET=<gerar-com-openssl-rand-base64-32>
  FRONTEND_URL=<url-do-frontend>
  PORT=3000
  RUST_LOG=info
  ```
- **Volume**: Mount `/app` (1GB)
- **Generate Domain**

### 4. Configurar Frontend Service
- **Root Directory**: `frontend`
- **Builder**: Docker
- **Variáveis**:
  ```
  VITE_API_URL=<url-do-backend>
  ```
- **Generate Domain**

### 5. Atualizar CORS
- Volte no backend
- Atualize `FRONTEND_URL` com a URL real do frontend
- Redeploy

## ✅ Verificação

### Testar Localmente (Opcional)
```bash
# Backend
cd backend
docker build -t pdv-backend .
docker run -p 3000:3000 --env-file .env pdv-backend

# Frontend
cd frontend
docker build -t pdv-frontend .
docker run -p 8080:80 pdv-frontend
```

### Testar em Produção
```bash
# Backend health check
curl https://backend-production-xxxx.up.railway.app/

# Frontend
# Abrir no navegador e testar login/registro
```

## 📊 Estrutura de Deploy

```
Railway Project
├── Backend Service
│   ├── Dockerfile build
│   ├── SQLite volume (/app)
│   └── Public domain
├── Frontend Service
│   ├── Dockerfile build
│   ├── Nginx serving
│   └── Public domain
└── Environment Variables
    ├── Backend: DATABASE_URL, JWT_SECRET, FRONTEND_URL
    └── Frontend: VITE_API_URL
```

## 🔐 Segurança

- [ ] JWT_SECRET gerado aleatoriamente
- [ ] `.env` no `.gitignore`
- [ ] CORS configurado com URL específica
- [ ] HTTPS automático (Railway)
- [ ] Senhas hasheadas (Argon2)

## 💰 Custos

- **Hobby Plan**: $5 crédito/mês (gratuito)
- **Uso estimado**: $3-4/mês (2 serviços + volume)
- **Suficiente para**: Desenvolvimento e testes

## 📚 Documentação

- Guia completo: `DEPLOY.md`
- Railway Docs: https://docs.railway.app/
- Troubleshooting incluído no guia

---

**Status**: ✅ Pronto para deploy  
**Data**: 16/12/2025
