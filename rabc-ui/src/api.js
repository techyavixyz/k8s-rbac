// api.js
const API = "/api"; // <-- relative URL ONLY

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include", // safe default
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

export const apiGet = (path) =>
  api(path, { method: "GET" });

export const apiPost = (path, body) =>
  api(path, {
    method: "POST",
    body: JSON.stringify(body)
  });

export const apiDelete = (path) =>
  api(path, { method: "DELETE" });
