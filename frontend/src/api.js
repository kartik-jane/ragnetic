export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export function apiUrl(path) {
  // Allow path values with or without a leading slash
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  return new URL(path, API_BASE_URL).toString()
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), options)
}
