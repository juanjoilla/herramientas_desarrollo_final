# Azure Static Site + GHAS

Sitio web estatico de ejemplo (Vite + JS vanilla) listo para:

- ✅ Compilarse (`npm run build`) y ejecutar **tests unitarios** (Vitest)
- ✅ **CI** de build + test en cada push/PR (`.github/workflows/ci.yml`)
- ✅ **Analisis de seguridad GHAS** con CodeQL y Dependency Review
- ✅ **Despliegue automatico** a un Azure Storage Account con hosting estatico

## Estructura del repositorio

```
.
├── index.html
├── src/
│   ├── main.js          # logica de UI
│   ├── utils.js         # logica de negocio (testeada)
│   ├── utils.test.js    # tests unitarios (Vitest)
│   └── style.css
├── infra/
│   └── main.bicep        # Storage Account (IaC)
├── .github/workflows/
│   ├── ci.yml                     # build + unit tests
│   ├── codeql.yml                 # GHAS - CodeQL
│   ├── dependency-review.yml      # GHAS - Dependency Review (PRs)
│   └── deploy-azure-storage.yml   # despliegue a Azure Storage
├── package.json
└── vite.config.js
```

## Desarrollo local

```bash
npm install
npm run dev        # servidor local
npm run test        # tests unitarios
npm run test:watch  # tests en modo watch
npm run build        # genera dist/
```

## 1. Crear la infraestructura en Azure

### Opcion A: con Azure CLI

```bash
RG=rg-static-site
LOCATION=westeurope
SA=miappstaticweb$RANDOM   # nombre unico global, solo minusculas/numeros

az group create -n $RG -l $LOCATION

az storage account create \
  -n $SA -g $RG -l $LOCATION \
  --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access true

# Habilitar hosting estatico (esto es una operacion de plano de datos,
# no se puede hacer via ARM/Bicep):
az storage blob service-properties update \
  --account-name $SA \
  --static-website \
  --index-document index.html \
  --404-document index.html
```

La URL publica del sitio sera algo como:
`https://<storage-account>.z6.web.core.windows.net/`

### Opcion B: con Bicep (`infra/main.bicep`)

```bash
az deployment group create \
  -g $RG \
  -f infra/main.bicep \
  -p storageAccountName=$SA
```

Tras el despliegue, ejecuta igualmente el comando de `az storage blob
service-properties update --static-website` de arriba (Bicep/ARM no expone
esa propiedad de datos).

## 2. Configurar autenticacion OIDC para GitHub Actions

El workflow de despliegue usa **federated credentials** (sin secretos de
larga duracion):

```bash
APP_NAME=gh-deploy-static-site
az ad app create --display-name $APP_NAME
APP_ID=$(az ad app list --display-name $APP_NAME --query "[0].appId" -o tsv)
az ad sp create --id $APP_ID

# Rol minimo necesario sobre la storage account
az role assignment create \
  --assignee $APP_ID \
  --role "Storage Blob Data Contributor" \
  --scope $(az storage account show -n $SA -g $RG --query id -o tsv)

# Credencial federada para la rama main
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<ORG>/<REPO>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Secrets/Variables a configurar en GitHub

En **Settings → Secrets and variables → Actions**:

| Nombre | Tipo | Valor |
|---|---|---|
| `AZURE_CLIENT_ID` | Secret | appId del App Registration |
| `AZURE_TENANT_ID` | Secret | `az account show --query tenantId -o tsv` |
| `AZURE_SUBSCRIPTION_ID` | Secret | `az account show --query id -o tsv` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Secret | nombre de la storage account ($SA) |
| `AZURE_RESOURCE_GROUP` | Variable (opcional, si usas CDN) | nombre del resource group |
| `AZURE_CDN_PROFILE_NAME` | Variable (opcional) | perfil de Azure CDN/Front Door |
| `AZURE_CDN_ENDPOINT_NAME` | Variable (opcional) | endpoint de CDN a purgar |

También crea un **Environment** llamado `production` (usado en
`deploy-azure-storage.yml`) para poder añadir reglas de aprobacion manual si
lo deseas.

## 3. Habilitar GHAS en el repositorio

En **Settings → Code security and analysis**, habilita:

- Dependency graph
- Dependabot alerts / Dependabot security updates
- Code scanning (el workflow `codeql.yml` ya está listo)
- Secret scanning (+ push protection)

Los workflows `codeql.yml` y `dependency-review.yml` se ejecutaran
automaticamente en cada push/PR a `main`, y `codeql.yml` ademas corre en
schedule semanal.

## Flujo completo

1. Push/PR a `main` → `ci.yml` compila y ejecuta los tests.
2. Push/PR a `main` → `codeql.yml` y `dependency-review.yml` analizan
   seguridad (GHAS).
3. Push a `main` → `deploy-azure-storage.yml` compila, testea y sube el
   contenido de `dist/` al contenedor `$web` de la Storage Account.
