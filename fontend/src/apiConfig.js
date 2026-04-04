/**
 * API base for fetch/axios.
 * - Leave REACT_APP_API_BASE unset in dev: use same-origin paths so CRA "proxy"
 *   in package.json forwards /users and /api to http://localhost:5001.
 * - Set REACT_APP_API_BASE=http://localhost:5001 only if you do not use the proxy.
 */
export function getApiOrigin() {
  const base = process.env.REACT_APP_API_BASE;
  if (base != null && String(base).trim() !== '') {
    return String(base).replace(/\/$/, '');
  }
  return '';
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${p}`;
}

export const API_PREFIX = `${getApiOrigin()}/api`;
