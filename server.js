require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

let access_token = process.env.ACCESS_TOKEN;
const refresh_token = process.env.REFRESH_TOKEN;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'FuturePlayerWeb.html'));
});

// Endpoint ricerca brani
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      headers: { Authorization: 'Bearer ' + access_token },
      params: { q: query, type: 'track', limit: 10 }
    });
    res.json(response.data.tracks.items); // ritorna solo le tracce
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshAccessToken();
      return res.redirect(`/search?q=${encodeURIComponent(query)}`);
    }
    console.error(err.response?.data || err);
    res.status(500).send('Errore ricerca Spotify');
  }
});

// Funzione per aggiornare Access Token
async function refreshAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);

  const res = await axios.post('https://accounts.spotify.com/api/token', params, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  access_token = res.data.access_token;
  console.log('✅ Access token aggiornato');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server avviato su ${PORT}`));
