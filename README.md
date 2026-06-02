# Ferreira & Neves — Empreendimentos Imobiliários

Site público + painel administrativo da imobiliária Ferreira & Neves.

Stack: **React 19 + Vite + TypeScript**, **Tailwind 4**, **Supabase** (Auth + Postgres + Storage), **TanStack Query**, **React Router 7**, **React Hook Form + Zod**, **Recharts**, **shadcn/ui** (Radix + class-variance-authority).

## Pré-requisitos

- Node 20+
- Conta no Supabase com projeto criado

## Setup

```bash
npm install
cp .env.example .env       # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

No Supabase, execute em ordem:
1. `supabase-setup.sql` — cria tabelas e dados iniciais
2. `supabase-policies.sql` — habilita RLS e libera storage

Crie os buckets de Storage `imoveis-fotos` e `assets` (públicos).
Crie um usuário em Auth → Users para acessar o painel.

## Scripts

```bash
npm run dev       # http://localhost:5173
npm run build     # type-check + bundle
npm run lint
npm run preview
```

## Estrutura

```
src/
├── components/         UI compartilhada (PropertyCard, PhotoUploader, ui/*)
├── contexts/           AuthContext, FavoritesContext
├── layouts/            PublicLayout, AdminLayout, ProtectedRoute
├── lib/                queries (React Query), supabase client, utils
├── pages/              rotas públicas
│   └── admin/          rotas do painel (Dashboard, Imóveis, Contratos…)
├── router/             definição de rotas
└── types/              tipos TS do domínio
```

## Rotas

**Público:** `/`, `/imoveis`, `/imoveis/:id`, `/favoritos`
**Admin:** `/admin/login`, `/admin`, `/admin/imoveis`, `/admin/imoveis/novo`, `/admin/imoveis/:id/editar`, `/admin/proprietarios`, `/admin/contratos`, `/admin/agendamentos`, `/admin/equipe`, `/admin/perfil`
