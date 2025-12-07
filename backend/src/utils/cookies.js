// src/utils/cookies.js

export function setAuthCookies(res, accessToken, refreshToken, accessTokenOpts, refreshTokenOpts) {
  res.cookie("app_jwt", accessToken, accessTokenOpts);
  res.cookie("app_refresh", refreshToken, refreshTokenOpts);
}

export function clearAuthCookies(res) {
  res.clearCookie("app_jwt", { path: "/" });
  res.clearCookie("app_refresh", { path: "/" });
  res.clearCookie("oauth_state", { path: "/" }); // Clear the OAuth state cookie as well
}
