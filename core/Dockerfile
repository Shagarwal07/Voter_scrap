# ==============================================================================
# Voter Scrap — Cloud AI Extraction Engine Docker Container (core/)
# ==============================================================================
# Packages the Python Gemini OCR and audit pipeline for deployment to
# GCP Cloud Run Jobs, Kubernetes, or Compute Engine batch worker VMs.
#
# Build Command (from repository root):
#   docker build -t voter-ocr -f core/Dockerfile .
#
# Run Commands:
#   docker run --env-file .env voter-ocr                        # Phase 1: Cloud Extraction
#   docker run --env-file .env -e MODE=recorrect voter-ocr     # Phase 2: Surgical Healing
# ==============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install all Python dependencies in a single cached layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the core extraction pipeline into /app/core
COPY core/ /app/core/

# Ensure unbuffered logging for real-time GCP Cloud Run and VM log streaming
ENV PYTHONUNBUFFERED=1

# Define the entrypoint to a shell script that checks the MODE env var:
# If MODE=recorrect, run Phase 2 (QA). Otherwise run Phase 1 (cloud_extractor.py)
ENTRYPOINT ["/bin/sh", "-c", "if [ \"$MODE\" = \"recorrect\" ]; then python /app/core/cloud/cloud_recorrection.py; else python /app/core/cloud/cloud_extractor.py; fi"]

