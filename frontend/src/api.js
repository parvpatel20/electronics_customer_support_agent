export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '');

function describeError(err) {
  if (err instanceof TypeError) {
    if (/fetch failed/i.test(err.message)) {
      return `Could not reach the support backend at ${API_BASE}. Make sure the API is running (try \`make backend\` in the project root) and that CORS allows this origin.`;
    }
    return err.message;
  }
  return err?.message || 'Unknown network error';
}

export async function apiFetch(path, options = {}) {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch (networkErr) {
    throw new Error(describeError(networkErr));
  }
}

export async function apiJson(path, options = {}) {
  let response;
  try {
    response = await apiFetch(path, options);
  } catch (networkErr) {
    throw new Error(describeError(networkErr));
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const detail = data?.detail || `Request failed with HTTP ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
