import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Central fetch wrapper for every backend call. Attaches the current
 * Firebase ID token (if signed in), parses JSON, and throws a normalized
 * ApiError on failure so callers can handle loading/error state consistently
 * instead of re-implementing fetch boilerplate on every page.
 */
export async function apiFetch(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };

  if (!skipAuth && auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError('Could not reach the SkillSwap server. Check your connection.', 0, networkErr);
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data?.details);
  }

  return data;
}
