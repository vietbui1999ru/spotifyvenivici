import { useState, useEffect } from 'react'
import './App.css'

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const redirect_uri = "http://127.0.0.1:5173/callback";

function App() {

  const [scope] = useState('user-read-private user-read-email user-read-recently-played')
  const [input, setInput] = useState(
    {
      url: "",
      token: "",
      refresh_token: "",
      expires_in: 0,
      scope: "",
    })

  // Generate random string for state parameter
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  // Handle login - redirect to Spotify authorization
  const handleLogin = () => {
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Load tokens from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    const refresh_token = localStorage.getItem('spotify_refresh_token');
    const expires = localStorage.getItem('spotify_token_expires');

    if (token && refresh_token && expires) {
      const expiresIn = Math.floor((parseInt(expires) - Date.now()) / 1000);

      if (expiresIn > 0) {
        setInput(prev => ({
          ...prev,
          token,
          refresh_token,
          expires_in: expiresIn,
        }));
      }
    }
  }, []);

  // Handle callback after Spotify redirects back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('spotify_auth_state');

    if (code && state === storedState) {
      // Clear the state
      localStorage.removeItem('spotify_auth_state');

      // Exchange code for access token via backend
      fetch('/api/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })
        .then(response => response.json())
        .then(data => {
          if (data.access_token) {
            setInput({
              url: "",
              token: data.access_token,
              refresh_token: data.refresh_token,
              expires_in: data.expires_in,
              scope: data.scope,
            });

            // Store tokens in localStorage for persistence
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
            localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
          }
        })
        .catch(error => {
          console.error('Error exchanging code for token:', error);
        });

      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Function to refresh access token
  const refreshAccessToken = async () => {
    const refresh_token = localStorage.getItem('spotify_refresh_token');
    if (!refresh_token) return;

    try {
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token })
      });

      const data = await response.json();

      if (data.access_token) {
        setInput(prev => ({
          ...prev,
          token: data.access_token,
          expires_in: data.expires_in,
        }));

        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return (
    <div className="App">
      <h1>Spotify OAuth with Vite</h1>

      {!input.token ? (
        <button onClick={handleLogin}>Login with Spotify</button>
      ) : (
        <div>
          <p>✓ Logged in successfully!</p>
          <p>Access Token: {input.token.substring(0, 20)}...</p>
          <p>Expires in: {input.expires_in} seconds</p>
          <button onClick={refreshAccessToken}>Refresh Token</button>
        </div>
      )}
    </div>
  )
}

export default App
