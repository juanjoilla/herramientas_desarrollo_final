#!/usr/bin/env bash
# Despliegue en Azure Container Apps usando Azure Container Registry (ACR)
# Requiere: az cli instalado y sesión iniciada (az login)
set -euo pipefail

# ---- Variables (ajusta a tu gusto) ----
RESOURCE_GROUP="rg-webapp-demo"
LOCATION="eastus"                       # por ejemplo: eastus, westeurope, southeastasia
ACR_NAME="acrwebappdemo$RANDOM"          # debe ser único globalmente
ENV_NAME="cae-webapp-demo"
APP_NAME="webapp-demo"
IMAGE_NAME="webapp-demo"
IMAGE_TAG="v1"

# 1. Grupo de recursos
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# 2. Registro de contenedores (ACR)
az acr create --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" --sku Basic --admin-enabled true

# 3. Build de la imagen directamente en Azure (no necesitas Docker local)
az acr build --registry "$ACR_NAME" \
  --image "$IMAGE_NAME:$IMAGE_TAG" .

# 4. Entorno de Container Apps (una sola vez por entorno)
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

az containerapp env create \
  --name "$ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

# 5. Credenciales del ACR para que Container Apps pueda hacer pull
ACR_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
ACR_USER=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# 6. Crear la Container App
az containerapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_SERVER/$IMAGE_NAME:$IMAGE_TAG" \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.25 --memory 0.5Gi

# 7. URL pública
az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" -o tsv
