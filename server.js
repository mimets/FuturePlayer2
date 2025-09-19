require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint per scambiare code con access token
app.post('/token', async (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).json({ error: 'Code mancante' });

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
          'Content-Type':'application/x-www-form-urlencoded',
          'Authorization':'Basic ' + Buffer.from(client_id+':'+client_secret).toString('base64')
        }
      }
    );

    res.json(tokenRes.data); // ritorna access_token, refresh_token, expires_in
  } catch(err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Errore nello scambio del token' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server avviato su ${PORT}`));
