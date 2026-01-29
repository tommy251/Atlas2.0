FROM python:3.12-slim

# Install Node.js 20 and other dependencies
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# Python deps
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Frontend build (with permission fix)
RUN cd frontend && \
    npm install --legacy-peer-deps && \
    chmod -R +x node_modules/.bin && \
    npm run build && \
    cd ..

# Expose the port (Render will override with $PORT)
EXPOSE 8000

# Use shell form for CMD to expand $PORT env var (fixes the integer error)
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}