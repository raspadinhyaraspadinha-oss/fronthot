# StreamVault — Landing Page de Conteúdo Premium

Plataforma de vídeos estilo premium com funil de conversão integrado. Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion**.

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** 8+

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves (Mangofy, Facebook CAPI, UTMify)

# 3. Rodar em desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Build de produção

```bash
npm run build
npm start
```

A aplicação roda na porta 3000 por padrão. Para mudar: `PORT=8080 npm start`.

## Subir no GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "feat: landing page StreamVault"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/fronthot.git
git push -u origin main
```

## Deploy na Railway

### Opção 1 — Conectar repo GitHub (recomendado)

1. Acesse [railway.app](https://railway.app) e faça login.
2. Clique em **New Project** → **Deploy from GitHub repo**.
3. Selecione o repositório `fronthot`.
4. Railway detecta automaticamente o Next.js.

### Opção 2 — Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Configurações no Railway

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Port** | `3000` (Railway injeta `PORT` automaticamente, Next.js respeita) |

### Variáveis de ambiente

No painel do Railway, vá em **Variables** e adicione:

```
MANGOFY_API_URL=https://checkout.mangofy.com.br/api/v1
MANGOFY_AUTHORIZATION=sua_auth
MANGOFY_STORE_CODE_HEADER=seu_store_code
MANGOFY_STORE_CODE_BODY=seu_store_code
MANGOFY_POSTBACK_URL=https://seudominio.railway.app/api/mangofy-callback

FACEBOOK_PIXEL_ID=seu_pixel_id
FACEBOOK_ACCESS_TOKEN=seu_token
FACEBOOK_GRAPH_API_URL=https://graph.facebook.com/v19.0
FACEBOOK_TEST_EVENT_CODE=

NEXT_PUBLIC_FACEBOOK_PIXEL_ID=seu_pixel_id

UTMIFY_API_URL=https://api.utmify.com.br/api-credentials/orders
UTMIFY_API_TOKEN=seu_token

REDIS_URL=redis://...

BASE_URL=https://seudominio.railway.app
```

> **Nota:** Se você não configurar as variáveis de API (Mangofy, Facebook, UTMify), a página funciona normalmente em modo simulação — o frontend mostra toasts de simulação e os endpoints retornam dados mock.

### Domínio e Healthcheck

- Railway gera um domínio `.railway.app` automaticamente.
- Para domínio customizado: **Settings** → **Networking** → **Custom Domain**.
- Healthcheck: Railway faz check automático na porta configurada.

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── check-payment/route.ts    # Polling de status do pagamento
│   │   ├── create-pix/route.ts       # Cria cobrança Pix via Mangofy
│   │   ├── mangofy-callback/route.ts # Webhook postback do Mangofy
│   │   └── track-event/route.ts      # Facebook CAPI (server-side)
│   ├── globals.css                   # Design tokens + Tailwind v4
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Página principal
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── VideoGrid.tsx
│   ├── overlay/
│   │   ├── MainOverlay.tsx           # Modal principal de planos
│   │   └── PreviewModal.tsx          # Modal de preview de vídeo
│   └── ui/
│       ├── Button.tsx
│       ├── CreditIndicator.tsx
│       ├── PlanCard.tsx
│       ├── ProgressBar.tsx
│       ├── ThemeToggle.tsx
│       ├── Toast.tsx
│       └── VideoCard.tsx
├── data/
│   ├── plans.ts                      # Dados mock dos planos
│   └── videos.ts                     # Dados mock dos vídeos
└── lib/
    ├── credits.ts                    # Sistema de créditos (localStorage)
    ├── pixel.ts                      # Facebook Pixel (browser)
    ├── store.ts                      # Store in-memory (substituir por Redis em prod)
    └── utm.ts                        # Captura e persistência de UTMs
```

## Fluxo de conversão

1. Usuário vem do anúncio (Facebook/Instagram) com UTMs na URL
2. Página captura UTMs + fbclid e salva no localStorage
3. Dispara Facebook Pixel PageView + CAPI PageView (server-side)
4. Overlay abre automaticamente com planos e créditos
5. Usuário escolhe plano → gera Pix → mostra QR code
6. Frontend faz polling do status → quando pago, mostra acesso
