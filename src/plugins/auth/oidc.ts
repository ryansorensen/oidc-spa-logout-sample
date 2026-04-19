import {createOidc} from 'oidc-spa/core'
import {z} from 'zod'

const decodedIdTokenSchema = z.object({
    preferred_username: z.string(),
    name: z.string(),
    email: z.string(),
    // configured in Keycloak: Client Scopes → dedicated mapper → Client Roles → add to ID token
    roles: z.array(z.string()),
})

type DecodedIdToken = z.infer<typeof decodedIdTokenSchema>

type OidcInstance = Awaited<ReturnType<typeof createOidc<DecodedIdToken>>>

const auth = {
    clientId: 'test-client',
    url: 'https://auth.test',
    realm: 'master',
}

export const issuerUri = `${auth.url}/realms/${auth.realm}`

let _oidc: OidcInstance | null = window.__oidc ?? null

export async function initializeOidc(): Promise<OidcInstance> {
    console.log(`Starting OIDC with issuer [${issuerUri}]; clientId [${auth.clientId}]`)

    _oidc = await createOidc({
        issuerUri,
        clientId: auth.clientId,
        decodedIdTokenSchema,
        // BUG (oidc-spa#177): autoLogoutParams.url is ignored.
        // oidc-spa always sends window.location.origin as post_logout_redirect_uri,
        // so Keycloak redirects to the app root on auto-logout, which re-triggers login.
        autoLogoutParams: {
            redirectTo: 'specific url',
            url: `${window.location.origin}/auth/signed-out.html`
        },
        debugLogs: import.meta.env.DEV
    })

    // persist oidc on window so that it survives hot reloads
    window.__oidc = _oidc
    return _oidc
}

function getOidc(): OidcInstance {
    if (!_oidc) throw new Error('OIDC not initialized. Call initializeOidc() first.')
    return _oidc
}

export async function getAccessToken(): Promise<string | undefined> {
    const oidc = getOidc()
    if (oidc.isUserLoggedIn) {
        const tokens = await oidc.getTokens()
        return tokens.accessToken
    }
}

export function isLoggedIn(): boolean {
    return _oidc?.isUserLoggedIn ?? false
}

export async function login(): Promise<void> {
    const oidc = getOidc()
    if (!oidc.isUserLoggedIn) {
        await oidc.login({doesCurrentHrefRequiresAuth: true})
    }
}

// BUG (oidc-spa#177): the `url` parameter is ignored by oidc-spa.
// oidc-spa hardcodes window.location.origin as post_logout_redirect_uri during UserManager
// initialization, so Keycloak always redirects back to the app root after logout.
// The app then re-initializes and launches the login flow instead of showing signed-out.html.
export async function logout(): Promise<void> {
    const oidc = getOidc()
    if (oidc.isUserLoggedIn) {
        await oidc.logout({
            redirectTo: 'specific url',
            url: `${window.location.origin}/auth/signed-out.html`
        })
    }
}

// Workaround for oidc-spa#177: bypass oidc.logout() and navigate directly to Keycloak's
// end_session_endpoint with the correct post_logout_redirect_uri.
export async function logoutWorkaround(): Promise<void> {
    const oidc = getOidc()
    if (!oidc.isUserLoggedIn) return

    const tokens = await oidc.getTokens()
    const postLogoutRedirectUri = `${window.location.origin}/auth/signed-out.html`

    const endSessionUrl = new URL(`${issuerUri}/protocol/openid-connect/logout`)
    endSessionUrl.searchParams.set('id_token_hint', tokens.idToken)
    endSessionUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri)
    endSessionUrl.searchParams.set('client_id', auth.clientId)

    window.location.href = endSessionUrl.toString()
}

export function getDecodedIdToken(): DecodedIdToken {
    const oidc = getOidc()
    if (!oidc.isUserLoggedIn) throw new Error('User is not logged in')
    return oidc.getDecodedIdToken()
}

export function isInRole(desiredRoles: string | string[]): boolean {
    const {roles} = getDecodedIdToken()
    const desired = Array.isArray(desiredRoles) ? desiredRoles : [desiredRoles]
    return desired.some(r => roles.includes(r))
}
