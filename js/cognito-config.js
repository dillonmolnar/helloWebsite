/**
 * Fill these in from the Cognito console (see the "Auth" panel on the home page).
 * redirectUri / signOutRedirectUri must match Allowed callback / sign-out URLs exactly.
 */
export const cognitoConfig = {
  region: "us-east-1",
  domainPrefix: "us-east-1h1dnzi478",
  clientId: "2sneebsg6a61gcss6ucq1rb7rh",
  redirectUri: "https://YOUR_AMPLIFY_OR_CUSTOM_DOMAIN/callback.html",
  signOutRedirectUri: "https://YOUR_AMPLIFY_OR_CUSTOM_DOMAIN/",
};
