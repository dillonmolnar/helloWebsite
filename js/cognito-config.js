/**
 * Fill these in from the Cognito console (see the "Auth" panel on the home page).
 * redirectUri / signOutRedirectUri must match Allowed callback / sign-out URLs exactly.
 */
export const cognitoConfig = {
  region: "us-east-1",
  domainPrefix: "REPLACE_WITH_YOUR_COGNITO_DOMAIN_PREFIX",
  clientId: "REPLACE_WITH_APP_CLIENT_ID",
  redirectUri: "https://YOUR_AMPLIFY_OR_CUSTOM_DOMAIN/callback.html",
  signOutRedirectUri: "https://YOUR_AMPLIFY_OR_CUSTOM_DOMAIN/",
};
