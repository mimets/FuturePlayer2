require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

let access_token = process.env.ACCESS_TOKEN;
const refresh_token = process.env.REFRESH_TOKEN;

app.use(express.static(path.join(__dirname, 'public')));

// Login endpoint
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-library-read streaming';
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  res.redirect(authURL);
});

// Callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if(!code) return res.send('Errore: nessun codice ricevuto');

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
    access_token = tokenRes.data.access_token;
    res.send('✅ Autenticazione completata. Puoi ora usare il player con ricerca globale!');
  } catch(err) {
    console.error(err.response?.data || err);
    res.send('Errore nello scambio del codice con token');
  }
});

// Endpoint ricerca globale brani/artist
app.get('/search', async (req,res)=>{
  const query = req.query.q;
  if(!query) return res.json([]);

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: 'Bearer ' + access_token },
      params: { q: query, type:'track', limit:10 }
    });
    res.json(response.data.tracks.items);
  } catch(err){
    console.error(err.response?.data||err);
    res.status(500).send('Errore nella ricerca Spotify');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server avviato su ${PORT}`));
