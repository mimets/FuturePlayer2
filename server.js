require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const refresh_token = process.env.REFRESH_TOKEN;

let access_token = null;

// Serve file statici (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Funzione per aggiornare access token
async function refreshAccessToken() {
  try {
    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token
      }),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    access_token = res.data.access_token;
    console.log('✅ Access token aggiornato:', access_token.substring(0, 20), '...'); // mostra solo i primi 20 caratteri
  } catch (err) {
    console.error('❌ Errore refresh token:', err.response?.data || err.message);
  }
}

// Aggiorna subito all'avvio e poi ogni 50 minuti
refreshAccessToken();
setInterval(refreshAccessToken, 50 * 60 * 1000);

// Endpoint per il frontend
app.get('/token', (req, res) => {
  if (!access_token) return res.status(500).json({ error: 'Token non disponibile' });
  res.json({ access_token });
});

// Endpoint di test debug
app.get('/test-token', async (req, res) => {
  await refreshAccessToken(); // forza refresh
  if (!access_token) return res.status(500).send('Token non disponibile');
  res.send(`Access Token generato correttamente: ${access_token.substring(0, 50)}...`);
});

// Callback OAuth (solo se vuoi ottenere refresh token via login)
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
      <p>Metti il refresh token nel file .env come REFRESH_TOKEN e riavvia il server</p>
    `);
  } catch (err) {
    console.error(err.response?.data || err);
    res.send('Errore durante lo scambio del codice con il token.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server avviato su porta ${PORT}`));
