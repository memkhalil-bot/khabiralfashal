// Temporary instrumentation for the admin auth redirect investigation.
// Persists the last redirect to localStorage so it survives the navigation
// itself and can be inspected on the page the user lands on (e.g. /admin/login).

const REDIRECT_KEY = 'admin-auth-last-redirect';

export interface RedirectLogEntry {
  reason: string;
  route: string;
  timestamp: string;
}

interface RedirectLogDetails {
  reason: string;
  route: string;
  user: string | null;
  session: boolean;
  isAdmin: boolean;
  loading: boolean;
  roleChecked: boolean;
  sessionChecked: boolean;
  roleCheckError: boolean;
  [key: string]: unknown;
}

export function recordRedirect(file: string, details: RedirectLogDetails): void {
  const timestamp = new Date().toISOString();

  console.error('[ADMIN REDIRECT]', { file, ...details, timestamp });

  try {
    localStorage.setItem(
      REDIRECT_KEY,
      JSON.stringify({ reason: details.reason, route: details.route, timestamp })
    );
  } catch {
    // localStorage unavailable — logging to console is still sufficient.
  }
}

export function getLastRedirect(): RedirectLogEntry | null {
  try {
    const raw = localStorage.getItem(REDIRECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function recordSignOutCall(file: string): void {
  console.error('[SIGN OUT CALLED]', { file, stack: new Error().stack });
}
