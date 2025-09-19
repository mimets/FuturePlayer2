require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('<h2>FuturePlayer Auth</h2><a href="/login">Accedi con Spotify</a>');
});

app.get('/login', (req, res) => {
  const scope = 'user-library-read';
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  res.redirect(authURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Errore: nessun codice ricevuto.');

  try {
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    res.send(`
      <h2>Autenticazione completata!</h2>
      <p>Access Token: ${access_token}</p>
      <p>Refresh Token: ${refresh_token}</p>
      <p>Scadenza (s): ${expires_in}</p>
    `);
  } catch (err) {
    console.error(err.response?.data || err);
    res.send('Errore durante lo scambio del codice con il token.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server avviato sulla porta ${PORT}`));
