import router from '@/router'

// Auth is guaranteed before the app mounts (see main.ts).
// This guard only removes OIDC query params left over from the Keycloak redirect.
export function configureRouter() {

    const oidcParams = [
        'oidc-spa_config_hash',
        'oidc-spa_result_omit',
        'oidc-spa_intent',
        'state',
        'session_state',
        'iss',
        'code',
    ]
    
    router.beforeEach((to, from, next) => {
        const hasOidcParams = Object.keys(to.query).some(key => oidcParams.includes(key))

        if (hasOidcParams) {
            const query = {...to.query}
            oidcParams.forEach(p => delete query[p])
            next({path: to.path, query, replace: true})
        } else {
            next()
        }
    })
}