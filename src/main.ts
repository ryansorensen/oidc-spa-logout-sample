import { oidcEarlyInit } from "oidc-spa/entrypoint";



const { shouldLoadApp } = oidcEarlyInit({
    BASE_URL: "/" // The path where your app is hosted
                  // If applicable you should use `process.env.PUBLIC_URL`
                  // or `import.meta.env.BASE_URL`.
                  // This is not an option. There's only one good answer.
});

if (shouldLoadApp) {
    // Note: Deferring the main app import adds a few milliseconds to cold start,
    // but dramatically speeds up auth. Overall, it's a net win.
    import("./main.lazy");
}