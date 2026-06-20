import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getLastRedirect } from '@/lib/adminAuthDebugLog';

/**
 * Temporary auth debug overlay.
 *
 * Activated by setting localStorage flag:
 *   localStorage.setItem('admin-auth-debug', '1')
 *
 * Automatically shown in DEV mode.
 * Only visible on /admin/* paths.
 */
export function AuthDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [, setTick] = useState(0); // drive live countdown
  const location = useLocation();

  const {
    user,
    session,
    isAdmin,
    loading,
    sessionChecked,
    roleChecked,
    roleChecking,
    roleCheckError,
    lastAuthEvent,
    lastRoleError,
    lastRoleCheckAt,
    tokenRefreshCount,
  } = useAdminAuth();

  useEffect(() => {
    const flag = localStorage.getItem('admin-auth-debug') === '1';
    setEnabled(flag || import.meta.env.DEV);
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!enabled) return null;
  if (!location.pathname.startsWith('/admin')) return null;

  const expiresAt = session?.expires_at;
  const expiresIn = expiresAt != null
    ? Math.max(0, Math.floor(expiresAt - Date.now() / 1000))
    : null;
  const lastCheckAgo = lastRoleCheckAt != null
    ? Math.floor((Date.now() - lastRoleCheckAt) / 1000)
    : null;
  const lastRedirect = getLastRedirect();

  type Row = [string, string, string?];
  const rows: Row[] = [
    ['path',          location.pathname],
    ['lastEvent',     lastAuthEvent ?? '—'],
    ['session',       session ? '✓ exists' : '✗ none', session ? 'ok' : 'warn'],
    ['user',          user ? user.email ?? user.id.slice(0, 12) + '…' : '—'],
    ['uid',           user ? user.id.slice(0, 8) + '…' : '—'],
    ['isAdmin',       String(isAdmin),               isAdmin ? 'ok' : 'warn'],
    ['loading',       String(loading),               loading ? 'warn' : 'ok'],
    ['roleChecking',  String(roleChecking),           roleChecking ? 'warn' : 'ok'],
    ['sessionChk',    String(sessionChecked),         sessionChecked ? 'ok' : 'warn'],
    ['roleChk',       String(roleChecked),            roleChecked ? 'ok' : 'warn'],
    ['roleChkErr',    String(roleCheckError),         roleCheckError ? 'err' : 'ok'],
    ['lastChk',       lastCheckAgo != null ? `${lastCheckAgo}s ago` : '—'],
    ['roleError',     lastRoleError ? lastRoleError.slice(0, 28) + '…' : '—', lastRoleError ? 'err' : 'ok'],
    ['expiresIn',     expiresIn != null ? `${expiresIn}s` : '—',
                      expiresIn != null && expiresIn < 300 ? 'warn' : undefined],
    ['refreshCount',  String(tokenRefreshCount)],
    ['lastRedirect',  lastRedirect ? lastRedirect.reason : '—', lastRedirect ? 'err' : 'ok'],
    ['redirectRoute', lastRedirect ? lastRedirect.route : '—'],
    ['redirectTime',  lastRedirect ? new Date(lastRedirect.timestamp).toLocaleTimeString() : '—'],
  ];

  const colorOf = (status?: string) => {
    if (status === 'ok')   return '#4ade80';
    if (status === 'warn') return '#fbbf24';
    if (status === 'err')  return '#f87171';
    return '#e5e7eb';
  };

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     12,
        left:       12,
        zIndex:     99999,
        background: 'rgba(5,5,5,0.94)',
        border:     '1px solid rgba(255,100,0,0.35)',
        borderRadius: 8,
        padding:    minimized ? '6px 12px' : '10px 14px',
        fontSize:   11,
        fontFamily: '"JetBrains Mono", "Fira Mono", monospace',
        color:      '#9ca3af',
        minWidth:   minimized ? 'auto' : 230,
        maxWidth:   300,
        boxShadow:  '0 4px 20px rgba(0,0,0,0.6)',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: minimized ? 0 : 8 }}>
        <span style={{ color: '#ff6400', fontWeight: 700, fontSize: 9, letterSpacing: '0.15em' }}>AUTH DEBUG</span>
        <button
          onClick={() => setMinimized(m => !m)}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 11, padding: '0 0 0 10px', lineHeight: 1 }}
        >
          {minimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Rows */}
      {!minimized && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {rows.map(([key, value, status]) => (
              <tr key={key}>
                <td style={{ color: '#4b5563', paddingRight: 10, paddingBottom: 2, whiteSpace: 'nowrap' }}>
                  {key}
                </td>
                <td style={{ color: colorOf(status), paddingBottom: 2, wordBreak: 'break-all' }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Dismiss link */}
      {!minimized && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
          <button
            onClick={() => { localStorage.removeItem('admin-auth-debug'); setEnabled(false); }}
            style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 9, letterSpacing: '0.1em' }}
          >
            DISMISS (clears flag)
          </button>
        </div>
      )}
    </div>
  );
}
