// src/utils/cookies.js

export function setAuthCookies(res, accessToken, refreshToken, accessTokenOpts, refreshTokenOpts) {
  res.cookie("app_jwt", accessToken, accessTokenOpts);
  res.cookie("app_refresh", refreshToken, refreshTokenOpts);
}

export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  const options = { 
    path: "/", 
    httpOnly: true, 
    secure: isProd, 
    sameSite: "lax" 
  };
  res.clearCookie("app_jwt", options);
  res.clearCookie("app_refresh", options);
  res.clearCookie("oauth_state", options);
  res.clearCookie("oauth_redirect", options);
}
