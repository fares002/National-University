# Docker Deployment Guide

This guide explains how to deploy the National University application using Docker while connecting to your local MySQL database.

## Prerequisites

1. **Docker Desktop** installed on your Windows machine
2. **MySQL** running locally on your machine
3. **Node.js** (for initial setup/testing only)

## Architecture

- **Frontend**: React app served by Nginx (containerized)
- **Backend**: Node.js/Express API (containerized)
- **Redis**: Cache server (containerized)
- **MySQL Database**: Running locally on your host machine (NOT containerized)

## Setup Instructions

### 1. Prepare Your Local MySQL Database

Ensure your MySQL database is accessible from Docker containers:

```sql
-- Connect to MySQL as root
-- Update user permissions to allow connections from Docker containers
GRANT ALL PRIVILEGES ON National_university.* TO 'National_university_admin'@'%' IDENTIFIED BY 'National_university';
FLUSH PRIVILEGES;
```

**Note**: For production, use a more restrictive host than `%` and a stronger password.

### 2. Configure Environment Variables

Copy the environment template:

```powershell
Copy-Item .env.docker .env
```

Edit the `.env` file and update:

- Email credentials
- JWT secrets (use a strong random string)
- Session secrets
- Google OAuth credentials (if applicable)
- Any other sensitive information

### 3. Update MySQL Configuration (Windows)

If MySQL refuses external connections, edit `my.ini` (usually in `C:\ProgramData\MySQL\MySQL Server X.X\`):

```ini
[mysqld]
bind-address = 0.0.0.0
```

Then restart MySQL service:

```powershell
Restart-Service MySQL80
```

### 4. Build and Run with Docker Compose

Build the containers:

```powershell
docker-compose build
```

Start all services:

```powershell
docker-compose up -d
```

View logs:

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### 5. Run Prisma Migrations

After the backend container starts, run migrations:

```powershell
docker-compose exec backend npx prisma migrate deploy
```

Or generate Prisma client if needed:

```powershell
docker-compose exec backend npx prisma generate
```

### 6. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Redis**: localhost:6379

## Docker Commands Reference

### Container Management

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Database Operations

```powershell
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Access backend shell
docker-compose exec backend sh

# Run database seed (if you have seed script)
docker-compose exec backend npm run seed
```

### Rebuilding After Code Changes

```powershell
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all services
docker-compose build
docker-compose up -d

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Cleanup

```powershell
# Remove stopped containers
docker-compose rm

# Remove all containers and volumes
docker-compose down -v

# Remove unused Docker resources
docker system prune -a
```

## Troubleshooting

### Backend Can't Connect to MySQL

**Error**: `ECONNREFUSED` or `Can't connect to MySQL server`

**Solutions**:

1. **Windows/Mac**: The docker-compose.yml uses `host.docker.internal` to access the host machine. This should work automatically.

2. **Verify MySQL is listening**:

   ```powershell
   netstat -an | findstr :3306
   ```

3. **Check MySQL user permissions**:

   ```sql
   SELECT host, user FROM mysql.user WHERE user = 'National_university_admin';
   ```

4. **Test connection from container**:
   ```powershell
   docker-compose exec backend sh
   # Inside container:
   npm install -g mysql
   mysql -h host.docker.internal -u National_university_admin -p
   ```

### Linux Host Configuration

If running on Linux, uncomment these lines in `docker-compose.yml`:

```yaml
backend:
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

### Redis Connection Issues

Check Redis is running:

```powershell
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Frontend Not Loading

1. Check if backend is healthy:

   ```powershell
   curl http://localhost:3000/api/v1/health
   ```

2. Check nginx logs:

   ```powershell
   docker-compose logs frontend
   ```

3. Verify environment variables in build:
   ```powershell
   docker-compose exec frontend cat /usr/share/nginx/html/assets/*.js | grep VITE_API_BASE_URL
   ```

### Port Already in Use

If ports 80, 3000, or 6379 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80" # Change host port
  backend:
    ports:
      - "3001:3000" # Change host port
  redis:
    ports:
      - "6380:6379" # Change host port
```

## Production Deployment

For production deployment:

1. **Use strong secrets**: Generate new JWT and session secrets
2. **Enable HTTPS**: Use a reverse proxy (nginx/Traefik) with SSL certificates
3. **Restrict CORS**: Update `CORS_ORIGIN` to your actual domain
4. **Secure Redis**: Set a strong `REDIS_PASSWORD`
5. **Database backups**: Set up automated MySQL backups
6. **Monitoring**: Add monitoring tools (e.g., Prometheus, Grafana)
7. **Resource limits**: Add resource limits to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## File Structure

```
National-University/
├── docker-compose.yml              # Main orchestration file
├── .env                           # Environment variables (git-ignored)
├── .env.docker                    # Environment template
├── README.Docker.md               # This file
├── National-Universty-Backend/
│   ├── Dockerfile                 # Backend container definition
│   ├── .dockerignore             # Files to exclude from build
│   └── ...
└── sudani-fin-flow/
    ├── Dockerfile                 # Frontend container definition
    ├── .dockerignore             # Files to exclude from build
    ├── nginx.conf                # Nginx configuration
    └── ...
```

## Health Checks

All services include health checks:

- **Backend**: GET http://localhost:3000/api/v1/health
- **Frontend**: GET http://localhost/health
- **Redis**: `redis-cli ping`

Check health status:

```powershell
docker-compose ps
```

## Notes

- Test files are excluded from the Docker build via `.dockerignore`
- The backend uses multi-stage builds to reduce image size
- Redis data persists in a Docker volume
- Frontend is optimized with gzip compression and static asset caching
