// src/utils/cookies.js

export function setAuthCookies(res, accessToken, refreshToken, accessTokenOpts, refreshTokenOpts) {
  const isProd = process.env.NODE_ENV === "production";
  const defaultOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  };

  res.cookie("app_jwt", accessToken, { ...defaultOpts, ...accessTokenOpts });
  res.cookie("app_refresh", refreshToken, { ...defaultOpts, ...refreshTokenOpts });
}

export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  const options = { 
    path: "/", 
    httpOnly: true, 
    secure: isProd, 
    sameSite: isProd ? "none" : "lax"
  };
  res.clearCookie("app_jwt", options);
  res.clearCookie("app_refresh", options);
  res.clearCookie("oauth_state", options);
  res.clearCookie("oauth_redirect", options);
}
