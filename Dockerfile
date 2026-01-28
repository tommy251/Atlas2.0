FROM python:3.12-slim

# Install Node.js 20
RUN apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

WORKDIR /app
COPY . /app

# Python deps
RUN pip install --upgrade pip && pip install -r requirements.txt

# Frontend build (with permission fix)
RUN cd frontend && npm install --legacy-peer-deps && chmod -R +x node_modules/.bin && npm run build && cd ..

EXPOSE $PORT
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "$PORT"]