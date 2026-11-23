# ==============================================================================
# Voter Scrap — Cloud AI Extraction Service Container (core/)
# ==============================================================================
# Dedicated Docker container for cloud batch workers running on GCP Compute
# Engine VMs, Cloud Run Jobs, or Kubernetes.
#
# Connects to Google Cloud Storage (GCS) and executes multimodal Vision AI
# extraction using Google Gemini 2.5 Flash on Vertex AI / Google AI Studio.
#
# Build Command (from repository root):
#   docker build -t voter-ocr-cloud -f core/Dockerfile .
#
# Run Commands:
#   1. Standard Cloud Extraction (Default):
#      docker run --env-file .env voter-ocr-cloud
#
#   2. Surgical Quality Re-correction (Phase 2):
#      docker run --env-file .env -e MODE=recorrect voter-ocr-cloud
#
#   3. Full Automated Cloud Pipeline (Orchestrator):
#      docker run --env-file .env -e MODE=pipeline voter-ocr-cloud
# ==============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies for C-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install cloud Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy cloud extraction modules and shared foundations
COPY core/ /app/core/

# Ensure unbuffered logging for real-time GCP Cloud Logging & VM console streams
ENV PYTHONUNBUFFERED=1

# Cloud worker entrypoint dispatcher:
# - Default: High-concurrency GCS bucket stream extraction (cloud_extractor.py)
# - MODE=recorrect: AI-driven surgical healing for suspect pages (cloud_recorrection.py)
# - MODE=pipeline: End-to-end cloud orchestrator (auto_pipeline.py)
ENTRYPOINT ["/bin/sh", "-c", "\
if [ \"$MODE\" = \"recorrect\" ]; then \
    python /app/core/cloud/cloud_recorrection.py \"$@\"; \
elif [ \"$MODE\" = \"pipeline\" ]; then \
    python /app/core/cloud/auto_pipeline.py \"$@\"; \
else \
    python /app/core/cloud/cloud_extractor.py \"$@\"; \
fi", "--"]
