#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-festive-post-473500-c3}"
REGION="${GCP_REGION:-us-west1}"
REPO="${GCP_ARTIFACT_REPO:-wiki-hip-hop}"
IMAGE_NAME="${GCP_IMAGE_NAME:-wiki-hip-hop}"
SERVICE="${CLOUD_RUN_SERVICE:-wiki-hip-hop}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:latest"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_KEY_VALUE="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format=json | python3 -c "import json,sys; d=json.load(sys.stdin); env=d['spec']['template']['spec']['containers'][0].get('env',[]); print(next((e['value'] for e in env if e.get('name')=='API_KEY'), ''))")"
if [[ -z "$API_KEY_VALUE" ]]; then
  echo "ERROR: Could not read API_KEY from existing Cloud Run service $SERVICE"
  exit 1
fi

gcloud config set project "$PROJECT_ID"

if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "Creating Artifact Registry repository: $REPO"
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Wiki Hip-hop container images" \
    --project="$PROJECT_ID"
fi

gcloud builds submit --tag "$IMAGE_URI" --project="$PROJECT_ID" --timeout=1200

gcloud run deploy "$SERVICE" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --project "$PROJECT_ID" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --port 8080 \
  --clear-volume-mounts \
  --clear-volumes \
  --set-env-vars "API_KEY=${API_KEY_VALUE},GEMINI_API_KEY=${API_KEY_VALUE}"

echo "Deployed $SERVICE to $REGION"
echo "URL: https://whh.maxxiao.com"
