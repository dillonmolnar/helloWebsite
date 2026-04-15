import { UserManager } from "oidc-client-ts";

// Use the deployed origin automatically (Amplify domain or CloudFront).
// This keeps the repo deployable without local environment setup.
const redirectUri = window.location.origin;
const logoutUri = window.location.origin;

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_h1DnZi478",
  client_id: "2sneebsg6a61gcss6ucq1rb7rh",
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "email openid phone",
};

export const userManager = new UserManager({
  ...cognitoAuthConfig,
});

export async function signOutRedirect() {
  const clientId = "2sneebsg6a61gcss6ucq1rb7rh";
  const cognitoDomain = "https://us-east-1h1dnzi478.auth.us-east-1.amazoncognito.com";
  await userManager.removeUser();
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

function displayUser(user) {
  const emailEl = document.getElementById("email");
  const accessEl = document.getElementById("access-token");
  const idEl = document.getElementById("id-token");
  const refreshEl = document.getElementById("refresh-token");

  if (!emailEl || !accessEl || !idEl || !refreshEl) return;

  if (!user) {
    emailEl.textContent = "";
    accessEl.textContent = "";
    idEl.textContent = "";
    refreshEl.textContent = "";
    return;
  }

  emailEl.textContent = user.profile?.email ?? "";
  accessEl.textContent = user.access_token ?? "";
  idEl.textContent = user.id_token ?? "";
  refreshEl.textContent = user.refresh_token ?? "";
}

const isOAuthCallback = () => {
  const q = window.location.search;
  return q.includes("code=") && q.includes("state=");
};

async function init() {
  const signIn = document.getElementById("signIn");
  const signOut = document.getElementById("signOut");

  if (isOAuthCallback()) {
    try {
      const user = await userManager.signinRedirectCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
      displayUser(user);
    } catch (e) {
      console.error("signinRedirectCallback failed", e);
      displayUser(null);
    }
  } else {
    try {
      const user = await userManager.getUser();
      displayUser(user);
    } catch (e) {
      console.error("getUser failed", e);
      displayUser(null);
    }
  }

  signIn?.addEventListener("click", async () => {
    await userManager.signinRedirect();
  });

  signOut?.addEventListener("click", async () => {
    await signOutRedirect();
  });
}

init();
