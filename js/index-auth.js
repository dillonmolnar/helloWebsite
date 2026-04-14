import {
  isAuthConfigured,
  signInWithRedirect,
  signOutHostedUi,
  getSession,
} from "./cognito-client.js";

function render() {
  const wrap = document.getElementById("auth-nav");
  if (!wrap) return;

  const session = getSession();
  const configured = isAuthConfigured();

  if (!configured) {
    wrap.innerHTML = `<span class="auth-hint"><a href="#cognito">Set up Cognito</a></span>`;
    return;
  }

  if (session?.email || session?.username) {
    const label = session.email || session.username;
    wrap.innerHTML = `
      <span class="auth-user" title="Signed in">${escapeHtml(label)}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="auth-signout">Sign out</button>
    `;
    document.getElementById("auth-signout")?.addEventListener("click", () => signOutHostedUi());
  } else {
    wrap.innerHTML = `
      <button type="button" class="btn btn-primary btn-sm" id="auth-signin">Sign in</button>
    `;
    document.getElementById("auth-signin")?.addEventListener("click", () => {
      signInWithRedirect().catch(() => {});
    });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

render();
