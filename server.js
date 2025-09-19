require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
let access_token = process.env.ACCESS_TOKEN; // token corrente
const refresh_token = process.env.REFRESH_TOKEN;

app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'FuturePlayerWeb.html'));
});

// Endpoint: ottieni playlist dell'utente
app.get('/playlists', async (req, res) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: 'Bearer ' + access_token }
    });
    res.json(response.data.items);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshAccessToken();
      return res.redirect('/playlists');
    }
    console.error(err.response?.data || err);
    res.status(500).send('Errore fetching playlists');
  }
});

// Endpoint: ottieni tracce di una playlist
app.get('/playlist/:id/tracks', async (req, res) => {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${req.params.id}/tracks`, {
      headers: { Authorization: 'Bearer ' + access_token }
    });
    res.json(response.data.items);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshAccessToken();
      return res.redirect(`/playlist/${req.params.id}/tracks`);
    }
    console.error(err.response?.data || err);
    res.status(500).send('Errore fetching tracks');
  }
});

// Funzione per aggiornare l'access token
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
