import React from 'react';

// Minimal OAuth callback handler used when the frontend is configured
// to receive GitHub's code/state and forward to the backend. In our
// current setup, GitHub redirects to the backend directly, which then
// redirects back to the frontend with ?auth=success. This component is
// still provided to satisfy the import and to support alternate flows.
const OAuthCallback: React.FC = () => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // If we have code+state, forward the browser to the backend callback
    // so it can set cookies and then redirect back to the app.
    if (code && state) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const backendCallback = `${apiBaseUrl}/v1/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      console.log('Forwarding to backend callback:', backendCallback);
      window.location.replace(backendCallback);
      return;
    }

    // Otherwise, go home. Backend flow already handles redirecting with ?auth=success
    window.location.replace('/');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Finishing sign-in…</p>
    </div>
  );
};

export default OAuthCallback;


