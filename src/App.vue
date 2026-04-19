<script setup lang="ts">
import { getDecodedIdToken, logout, logoutWorkaround, issuerUri } from "@/plugins/auth/oidc.ts";

const user = getDecodedIdToken()
const origin = window.location.origin
const endSessionEndpoint = `${issuerUri}/protocol/openid-connect/logout`
const postLogoutRedirectUri = `${origin}/auth/signed-out.html`
</script>

<template>
  <main>
    <h1>oidc-spa logout bug demo</h1>
    <p>Reproduces <a href="https://github.com/keycloakify/oidc-spa/issues/177" target="_blank">oidc-spa#177</a></p>

    <section class="user-info">
      <p>Signed in as <strong>{{ user.name }}</strong> &mdash; {{ user.email }}</p>
    </section>

    <section class="scenario">
      <h2>Broken: <code>oidc.logout()</code></h2>
      <p>
        Calls <code>oidc.logout(&#123; redirectTo: 'specific url', url: '/auth/signed-out.html' &#125;)</code>.
        The <code>url</code> parameter is ignored. oidc-spa always sends
        <code>{{ origin }}</code> as <code>post_logout_redirect_uri</code>,
        so Keycloak redirects back to the app root, which re-initializes and launches the login flow
        instead of showing the signed-out page.
      </p>
      <button class="btn btn-broken" @click="logout()">Sign out (broken)</button>
    </section>

    <section class="scenario">
      <h2>Workaround: direct end_session navigation</h2>
      <p>
        Bypasses <code>oidc.logout()</code> entirely. Navigates directly to
        <code>{{ endSessionEndpoint }}</code> with
        <code>post_logout_redirect_uri={{ postLogoutRedirectUri }}</code>.
        Keycloak redirects straight to the signed-out page.
      </p>
      <button class="btn btn-workaround" @click="logoutWorkaround()">Sign out (workaround)</button>
    </section>
  </main>
</template>

<style scoped>
main {
  max-width: 720px;
  margin: 2rem auto;
  font-family: sans-serif;
  padding: 0 1rem;
}

h1 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.user-info {
  background: #f0f4ff;
  border-left: 4px solid #4a7cf6;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin: 1.5rem 0;
}

.scenario {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.scenario h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.scenario p {
  font-size: 0.875rem;
  color: #444;
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
}

.btn-broken {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-broken:hover {
  background: #fecaca;
}

.btn-workaround {
  background: #dcfce7;
  color: #15803d;
}

.btn-workaround:hover {
  background: #bbf7d0;
}
</style>
