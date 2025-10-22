import process from "process";
export function spotifyOAuthPlugin() {
  return {
    name: "spotify-oauth-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle token exchange endpoint
        if (req.url === "/api/spotify/token" && req.method === "POST") {
          let body = "";

          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              const { code } = JSON.parse(body);

              const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
              const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET;
              const redirectUri = "http://127.0.0.1:5173/callback";

              // Exchange code for access token
              const tokenResponse = await fetch(
                "https://accounts.spotify.com/api/token",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization:
                      "Basic " +
                      Buffer.from(clientId + ":" + clientSecret).toString(
                        "base64",
                      ),
                  },
                  body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri,
                  }),
                },
              );

              const data = await tokenResponse.json();

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(data));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });

          return;
        }

        // Handle refresh token endpoint
        if (req.url === "/api/spotify/refresh" && req.method === "POST") {
          let body = "";

          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              const { refresh_token } = JSON.parse(body);

              const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
              const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET;

              // Refresh access token
              const tokenResponse = await fetch(
                "https://accounts.spotify.com/api/token",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization:
                      "Basic " +
                      Buffer.from(clientId + ":" + clientSecret).toString(
                        "base64",
                      ),
                  },
                  body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: refresh_token,
                  }),
                },
              );

              const data = await tokenResponse.json();

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(data));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });

          return;
        }

        next();
      });
    },
  };
}
