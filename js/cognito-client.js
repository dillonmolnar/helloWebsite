import { cognitoConfig as config } from "./cognito-config.js";

const TOKENS_KEY = "cognito_tokens";
const PKCE_VERIFIER_KEY = "cognito_pkce_verifier";
const OAUTH_STATE_KEY = "cognito_oauth_state";

function cognitoBaseUrl() {
  return `https://${config.domainPrefix}.auth.${config.region}.amazoncognito.com`;
}

function base64UrlEncode(bytes) {
  let binary = "";
  const u8 = new Uint8Array(bytes);
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Bytes(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data);
}

async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(verifierBytes);
  const challenge = base64UrlEncode(await sha256Bytes(verifier));
  return { verifier, challenge };
}

function randomState() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));
}

export function isAuthConfigured() {
  const d = String(config.domainPrefix || "");
  const c = String(config.clientId || "");
  const r = String(config.redirectUri || "");
  const o = String(config.signOutRedirectUri || "");
  return (
    d &&
    !d.includes("REPLACE") &&
    c &&
    !c.includes("REPLACE") &&
    r &&
    !r.includes("REPLACE") &&
    !r.includes("YOUR_AMPLIFY") &&
    o &&
    !o.includes("REPLACE") &&
    !o.includes("YOUR_AMPLIFY")
  );
}

export async function signInWithRedirect() {
  if (!isAuthConfigured()) {
    window.location.hash = "cognito";
    throw new Error("Finish js/cognito-config.js first.");
  }
  const { verifier, challenge } = await createPkcePair();
  const state = randomState();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: config.redirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.assign(`${cognitoBaseUrl()}/oauth2/authorize?${params.toString()}`);
}

export function getStoredTokens() {
  const raw = sessionStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseJwtPayload(jwt) {
  if (!jwt || typeof jwt !== "string") return null;
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getSession() {
  const tokens = getStoredTokens();
  if (!tokens?.id_token) return null;
  const claims = parseJwtPayload(tokens.id_token);
  if (!claims) return { tokens, email: null, username: null };
  return {
    tokens,
    email: claims.email ?? null,
    username: claims["cognito:username"] ?? claims.sub ?? null,
  };
}

export function signOutHostedUi() {
  sessionStorage.removeItem(TOKENS_KEY);
  if (!isAuthConfigured()) {
    window.location.reload();
    return;
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.signOutRedirectUri,
  });
  window.location.assign(`${cognitoBaseUrl()}/logout?${params.toString()}`);
}

export async function completeRedirectSignIn() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (err) {
    const desc = params.get("error_description") ?? "";
    throw new Error(`${err}: ${desc}`);
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    throw new Error("Missing or invalid OAuth response. Try signing in again.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(`${cognitoBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error_description || json.error || `Token exchange failed (${res.status})`);
  }

  sessionStorage.setItem(TOKENS_KEY, JSON.stringify(json));
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);

  const home = new URL(".", config.redirectUri).href;
  window.location.replace(home);
}
