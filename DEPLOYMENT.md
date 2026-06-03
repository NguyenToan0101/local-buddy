# Local Buddy Deployment

Production secrets must live outside the Git checkout. Do not keep the real
backend environment in `/root/local-buddy/.env`, because deploy pulls or file
copies can overwrite it.

## Production env file

Create this file on the server:

```bash
sudo mkdir -p /etc/local-buddy
sudo nano /etc/local-buddy/backend.env
sudo chmod 600 /etc/local-buddy/backend.env
```

Required keys:

```env
SPRING_DATASOURCE_URL=...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
OAUTH2_REDIRECT_URI_FRONTEND=https://localbuddy.online/oauth2/success
API_FRONTEND=https://localbuddy.online
```

`docker-compose.yml` reads `/etc/local-buddy/backend.env` by default.

For local Docker Compose, use:

```bash
BACKEND_ENV_FILE=.env docker compose up -d
```

On Windows PowerShell:

```powershell
$env:BACKEND_ENV_FILE=".env"
docker compose up -d
```

## Deploy

On the server:

```bash
cd /root/local-buddy
git pull
docker compose pull
docker compose up -d
```

## Verify

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker logs --tail=120 local-buddy-backend-1
curl -k https://localbuddy.online/api/buddies
curl -k -I https://localbuddy.online/oauth2/authorization/google
```

Expected:

- `/api/buddies` returns `200` with JSON.
- `/oauth2/authorization/google` returns `302`.

If backend logs show `${SPRING_DATASOURCE_URL}`, the backend env file is not
being loaded.
