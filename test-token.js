require('dotenv').config();
const axios = require('axios');

async function refreshToken() {
  try {
    const res = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type:'refresh_token',
        refresh_token: process.env.REFRESH_TOKEN
      }),
      {
        headers: {
          'Authorization':'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID+':'+process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
          'Content-Type':'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('Access Token:', res.data.access_token);
  } catch(e) {
    console.error('Errore token:', e.response?.data || e);
  }
}

refreshToken();
