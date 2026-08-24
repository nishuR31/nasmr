# ==========================================
# Builder Stage
# ==========================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model at build time to cache it in the builder
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# ==========================================
# Consumer Stage (Runner)
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Install only runtime system dependencies (GDAL and GEOS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal32 \
    libgeos-c1v5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from the builder
COPY --from=builder /opt/venv /opt/venv
# Ensure the virtual environment is used
ENV PATH="/opt/venv/bin:$PATH"

# Copy the application code
COPY . .

# Set default environment variables
ENV HOST="0.0.0.0"
ENV PORT=8000

EXPOSE 8000

# Start Gunicorn with Uvicorn workers
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
