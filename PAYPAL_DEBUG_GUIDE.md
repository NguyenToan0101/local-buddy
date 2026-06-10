# PayPal Integration - Debugging Guide

## Error: 401 Unauthorized on Payment Creation

### Possible Causes

1. **PayPal Credentials Not Loaded**
   - `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` not set in environment
   - `.env` file not loaded properly by Spring Boot

2. **Invalid PayPal Credentials**
   - Client ID or Secret expired
   - Credentials are from wrong PayPal account

3. **Network/CORS Issues**
   - Backend cannot reach PayPal API servers
   - Firewall blocking PayPal sandbox/live APIs

## Quick Diagnostics

### Step 1: Check PayPal Configuration
Call the debug endpoint:
```bash
curl http://localhost:8080/api/payments/health
```

Expected response:
```json
{
  "status": "ok",
  "paypal_configured": "true"
}
```

If you see `paypal_configured: "false"`, then credentials are not loaded.

### Step 2: Verify .env File
Backend `.env` file location: `backend/.env`

Must contain:
```env
PAYPAL_CLIENT_ID=AYmpK0VLWKR_c2GEFlGlB30ho2k1bdtAoSu3g9QX_MBSw4ScptAYFxIQRCb0221qgp9tm0qZC54MExIK
PAYPAL_CLIENT_SECRET=EL-LSgNajIYdKz3xTAqCl0j0cLPvKka5EYWcVXAarWNRbI2kT21i8BF56bV_lUv8KVonbxUOd6Kml9yV
PAYPAL_MODE=sandbox
```

### Step 3: Check Backend Logs
Look for PayPal token request logs:
```
Requesting PayPal token from: https://api-m.sandbox.paypal.com/v1/oauth2/token
```

If you see error like:
```
PayPal token request failed. Status: 401
```

Then credentials are invalid.

## Solutions

### Solution 1: Ensure .env File is Loaded
Make sure `spring.config.import` is in `application.properties`:
```properties
spring.config.import=optional:file:.env[.properties]
```

### Solution 2: Restart Backend
After adding/updating `.env` file, restart Spring Boot:
```bash
# Stop current process (Ctrl+C)
# Then restart:
./mvnw spring-boot:run
```

### Solution 3: Verify PayPal Credentials
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com)
2. Login with your PayPal account
3. Navigate to **Apps & Credentials**
4. Select **Sandbox** mode
5. Copy the **Client ID** and **Secret** from the app credentials
6. Update `.env` file with correct credentials
7. Restart backend

### Solution 4: Test with Postman

Test PayPal token endpoint directly:

1. **Create new POST request**
   - URL: `https://api-m.sandbox.paypal.com/v1/oauth2/token`

2. **Set Authorization**
   - Type: `Basic Auth`
   - Username: `[Your Client ID]`
   - Password: `[Your Client Secret]`

3. **Set Body**
   - Type: `x-www-form-urlencoded`
   - Key: `grant_type`
   - Value: `client_credentials`

4. **Send**
   - Should return `access_token` if credentials are valid
   - If 401: credentials are wrong

## Frontend Debugging

### Check Browser Console
Network tab should show POST requests to:
```
/api/payments/paypal/create-order
/api/payments/paypal/capture-order
```

Look for error messages in response body.

### Enable Detailed Error Logs
Checkout.tsx now shows backend error messages. Check the UI error display for PayPal messages.

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `PAYPAL_CLIENT_ID is not configured` | Environment variable not set | Check `.env` file |
| `PAYPAL_CLIENT_SECRET is not configured` | Environment variable not set | Check `.env` file |
| `401 Unauthorized` | Invalid credentials | Verify credentials in PayPal Dashboard |
| `Failed to create PayPal order` | Payment data invalid | Check booking details |

## Success Indicators

✅ `/api/payments/health` returns `"paypal_configured": "true"`
✅ Backend logs show `Requesting PayPal token from: https://...`
✅ Backend logs show `PayPal token request successful`
✅ PayPal button appears on checkout page
✅ User can proceed with PayPal payment
