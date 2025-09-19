require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
let access_token = null;

// Funzione per aggiornare l'access token usando il refresh token
async function refreshAccessToken(){
  try{
    const res = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type:'refresh_token',
        refresh_token: process.env.REFRESH_TOKEN
      }),
      { headers: { 'Authorization':'Basic '+ Buffer.from(client_id+':'+client_secret).toString('base64'),
                  'Content-Type':'application/x-www-form-urlencoded' } }
    );
    access_token = res.data.access_token;
    console.log('Access token aggiornato');
  }catch(e){ console.error('Errore refresh token', e.response?.data||e); }
}

// Aggiorna token all’avvio e ogni 30 minuti
refreshAccessToken();
setInterval(refreshAccessToken, 30*60*1000);

// Endpoint per restituire token al frontend
app.get('/token', (req,res)=>{
  if(!access_token) return res.status(500).json({error:'Token non disponibile'});
  res.json({access_token});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server avviato su ${PORT}`));
