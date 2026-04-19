# oidc-spa logout bug sample

Reproduces [oidc-spa#177](https://github.com/keycloakify/oidc-spa/issues/177): `logout({ redirectTo: 'specific url', url: '...' })` sends the wrong `post_logout_redirect_uri` to Keycloak.

## The bug

When calling `oidc.logout({ redirectTo: 'specific url', url: '/auth/signed-out.html' })`, oidc-spa ignores the `url` parameter. It hardcodes `window.location.origin` as `post_logout_redirect_uri` during `UserManager` initialization in `createOidc.js`.

After logout, Keycloak redirects to the app root. The SPA re-initializes, `oidcEarlyInit` runs, and the login flow starts — instead of landing on `/auth/signed-out.html`. The same issue affects `autoLogoutParams` (token expiry auto-logout).

## Setup

### 1. Keycloak client configuration

Create a client in Keycloak with:

| Setting | Value |
|---|---|
| Client ID | `test-client` |
| Client authentication | Off (public client) |
| Valid redirect URIs | `http://localhost:5173/*` |
| Valid post logout redirect URIs | `http://localhost:5173/*` |
| Web origins | `http://localhost:5173` |

### 2. Configure the app

Edit `src/plugins/auth/oidc.ts` and set `auth.url` and `auth.realm` to match your Keycloak instance:

```ts
const auth = {
    clientId: 'test-client',
    url: 'https://your-keycloak-host',  // change this
    realm: 'master',                    // change this if needed
}
```

### 3. Run

```sh
yarn install
yarn dev
```

Open `http://localhost:5173`. Log in when prompted.

## Reproducing the bug

**Expected:** after clicking "Sign out", the browser lands on `/auth/signed-out.html`.

**Actual:** after clicking "Sign out (broken)", the browser returns to the app root and the Keycloak login page appears.

To observe the network behavior:

1. Open DevTools → Network tab
2. Click **Sign out (broken)**
3. Watch the redirect to Keycloak's `end_session_endpoint` — note that `post_logout_redirect_uri` is set to the app root (`http://localhost:5173`), not `/auth/signed-out.html`
4. Keycloak redirects back to the app root, the SPA boots, and login starts again

## Workaround

Click **Sign out (workaround)**. This bypasses `oidc.logout()` and navigates directly to Keycloak's `end_session_endpoint` with the correct `post_logout_redirect_uri`. The browser lands on `/auth/signed-out.html` as expected.

See `logoutWorkaround()` in [`src/plugins/auth/oidc.ts`](src/plugins/auth/oidc.ts).

## Relevant files

| File | Description |
|---|---|
| `src/plugins/auth/oidc.ts` | `logout()` (broken) and `logoutWorkaround()` (manual end_session) |
| `src/App.vue` | UI with both logout buttons and explanations |
| `public/auth/signed-out.html` | The intended post-logout destination |
| `src/main.ts` | `oidcEarlyInit` entrypoint — this is what re-runs on the redirect-to-root |
