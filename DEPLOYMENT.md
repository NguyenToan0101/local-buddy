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
APP_EMAIL_LOG_SENSITIVE_FALLBACK=false
RESEND_API_KEY=...
EMAIL_FROM=Local Buddy <noreply@localbuddy.online>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
OAUTH2_REDIRECT_URI_FRONTEND=https://localbuddy.online/oauth2/success
API_FRONTEND=https://localbuddy.online
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AI_SERVICE_BASE_URL=http://ai-verification-service:8001
ALLOWED_MEDIA_HOSTS=res.cloudinary.com
MAX_DOWNLOAD_MB=35
ANTISPOOF_MODEL_PATH=/models/minifasnet_v2.onnx
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
docker compose up -d --build
```

The AI verification service is exposed only inside the Compose network by
default. Spring Boot reaches it through `AI_SERVICE_BASE_URL`; do not publish
port `8001` on a public server unless the service is protected.

`docker-compose.yml` mounts `./ai-verification-service/models` into the AI
container as `/models`. The included MiniFASNet ONNX anti-spoofing model is
expected at `/models/minifasnet_v2.onnx`.

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

## Cloudinary image migration

New uploads go through backend multipart endpoints and store only Cloudinary
`secure_url` values in the database. Existing Base64 data URI values still
render because responses return the stored string until migration replaces it.

To migrate old Base64 image data, set `CLOUDINARY_MIGRATE_BASE64=true` for one
backend startup, watch the logs for success/failure counts, then set it back to
`false`.

Manual test checklist:

- Upload traveler avatar from profile edit and verify the response contains a URL.
- Upload buddy profile avatar and CCCD front/back from buddy settings.
- Verify admin verification displays avatar and CCCD images.
- Verify old `data:image/...;base64,...` records still display before migration.
- Run the migration once in staging and confirm records with existing URLs are skipped.
