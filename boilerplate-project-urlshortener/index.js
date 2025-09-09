require('dotenv').config();
const bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
const dns = require("dns")
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urlDatabase = {};
/*
  Model for URL database

  original_url
  short_url
  short_url_id

*/

function generateID() {
  return Math.floor(Math.random() * 1000000) + 1;
}

app.post("/api/shorturl", (req, res) => {
  // check if the url is valid
  let url = req.body.url
  let parsedURL;
  try {
    parsedURL = new URL(url);
  } catch (err) {
    return res.json({ error: "Invalid URL" });
  }

  if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
    return res.json({ error: "Invalid URL" });
  }


  dns.lookup(parsedURL.hostname, (err, data) => {
    if (err) {
      res.json({
        "error": "Invalid URL"
      })
      return
    }
    if (data) {
      let id = generateID()
      urlDatabase[id] = {
        original_url: url,
        short_url: id
      }
      res.json({
        original_url: url,
        short_url: id
      })

      return

    }
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl].original_url;

  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
