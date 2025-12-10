# PDV_RUST_SQLITE

Sistema de PDV (Ponto de Venda) SaaS Multi-Tenant desenvolvido em Rust + React.

## Tecnologias

### Backend
- **Rust** com Axum framework
- **SQLite** para banco de dados
- **SQLx** para queries type-safe
- **JWT** para autenticação
- **Argon2** para hash de senhas

### Frontend
- **React** com TypeScript
- **Vite** para build
- **TailwindCSS** + Shadcn UI
- **Zustand** para state management
- **React Router** para navegação

## Estrutura

```
PDV_Rust/
├── backend/          # API Rust
│   ├── src/
│   │   ├── handlers/ # Rotas e lógica
│   │   ├── models.rs # Modelos de dados
│   │   ├── auth.rs   # Autenticação
│   │   └── main.rs
│   └── migrations/   # Migrações SQL
└── frontend/         # Interface React
    └── src/
        ├── pages/    # Páginas
        └── components/ # Componentes
```

## Funcionalidades

### Gestão Multi-Tenant
- **Admin Master**: Gerencia todo o sistema
- **Revendedores**: Criam e gerenciam lojas
- **Lojistas**: Gerenciam suas próprias lojas

### CRUD Completo
- ✅ Usuários (Create, Read, Update, Delete)
- ✅ Lojas/Tenants (Create, Read, Update, Delete)
- ✅ Produtos
- ✅ Vendas
- ✅ Clientes

### Recursos
- Autenticação JWT
- Controle de acesso por roles
- Dashboard com estatísticas
- Gestão de estoque
- Registro de vendas

## Como Executar

### Backend
```bash
cd backend
cargo run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Licença

Projeto proprietário - Todos os direitos reservados.
