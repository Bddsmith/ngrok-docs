<!-- Code generated for API Clients. DO NOT EDIT. -->

#### Example Request

```bash
curl \
-X PUT \
-H "Authorization: Bearer {API_KEY}" \
-H "Content-Type: application/json" \
-H "Ngrok-Version: 2" \
-d '{"client_id":"some-client-id","client_secret":"some-client-secret","enabled":true,"issuer":"https://accounts.google.com","scopes":["profile"]}' \
https://api.ngrok.com/edges/https/edghts_31BN0YBXQ5BoBW78qmh6el7O6QV/routes/edghtsrt_31BN0fsD9PnWK0NbSFkEW6dM2gf/oidc
```
