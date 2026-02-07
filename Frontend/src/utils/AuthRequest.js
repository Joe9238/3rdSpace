export async function authRequest(url, options = {}) {
  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // If access token expired (401), try refresh once
  if (res.status === 401) {
    const refresh = await fetch(`/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!refresh.ok) {
      return res;
    }

    // Retry original request
    res = await fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  return res;
}
