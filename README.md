# Development Setup with Docker

## Install Docker
Before running the project, make sure Docker is installed on your machine:

1. **Install Docker Desktop**  
   - [Docker Desktop Installation](https://www.docker.com/products/docker-desktop/)  

2. **Verify Installation**
   - You can verify installation by running:
```bash
docker --version
```

## Start Development Services

> **Note:** Make sure Docker Desktop is running before starting the containers.

```bash
npm run docker:dev
```

Once running, the services will be available at:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8080

## Stop Development Services

```bash
npm run docker:stop
```