# Deploy — Pitstop OS

## Arquitetura

```
GitHub (main) ──push──► GitHub Actions
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
         Vercel (Frontend)       Azure App Service B1 (Backend)
         React + Vite SPA        Node.js / Express
```

---

## Backend — Azure App Service B1

### 1. Criar o App Service no portal

- Runtime: **Node 20 LTS**
- OS: **Linux**
- Plano: **B1**
- Region: recomendado **Brazil South** ou **East US**

### 2. Obter o Publish Profile

No portal → App Service → **Get publish profile** → baixar o arquivo XML.

### 3. GitHub Secrets necessários

| Secret | Valor |
|---|---|
| `AZURE_APP_NAME` | Nome do App Service (ex: `pitstop-os-api`) |
| `AZURE_PUBLISH_PROFILE` | Conteúdo completo do arquivo `.PublishSettings` |

### 4. Application Settings (variáveis de ambiente) no App Service

Configurar em: **App Service → Configuration → Application settings**

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `FRONTEND_URL` | URL do frontend na Vercel (ex: `https://pitstop-os.vercel.app`) |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Client email da service account |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account (com `\n` literais) |

> **Importante:** O `FIREBASE_PRIVATE_KEY` deve ser colado com as quebras de linha substituídas por `\n`.
> O `firebase.js` já faz o `replace(/\\n/g, '\n')` automaticamente.

### 5. Deploy

Push para a branch `main` com alterações em `backend/` dispara o workflow automaticamente.

---

## Frontend — Vercel

### 1. Conectar o repositório na Vercel

- Acessar [vercel.com](https://vercel.com) → **Add New Project**
- Selecionar o repositório GitHub
- **Root Directory**: `frontend`
- Framework Preset: **Vite**

### 2. Variáveis de ambiente na Vercel

Configurar em: **Project → Settings → Environment Variables**

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL do backend no Azure (ex: `https://pitstop-os-api.azurewebsites.net`) |
| `VITE_FIREBASE_API_KEY` | API Key do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain do Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Project ID do Firebase |

### 3. GitHub Secrets para o workflow (opcional)

Se quiser usar o GitHub Actions em vez do deploy automático da Vercel:

| Secret | Como obter |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `vercel env pull` ou Settings → General |
| `VERCEL_PROJECT_ID` | Settings → General do projeto na Vercel |

> **Dica:** A Vercel já faz deploy automático ao conectar o repo — o workflow do GitHub Actions é opcional, útil se quiser controle fino sobre quando deployar.

---

## Health check

Após o deploy, verificar:

```
GET https://<seu-app>.azurewebsites.net/health
→ { "ok": true }
```
