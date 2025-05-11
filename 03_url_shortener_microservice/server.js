require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', (req, res) => {
  res.send('URL Shortener Microservice');
});

// Endpoint to get the original URL using short URL
app.get("/api/shorturl/:input", (req, res) => {
  const input = parseInt(req.params.input);

  Url.findOne({ short_url: input }, function (err, data) {
    if (err || data === null) {
      return res.json({ error: "URL NOT FOUND" });
    }
    return res.redirect(data.original_url);
  });
});

// Endpoint to create a new short URL
app.post('/api/shorturl', async (req, res) => {
  const userUrl = req.body.url;

  if (!userUrl) {
    return res.json({ error: 'missing url' });
  }

  // Validating the URL with a regex for proper format
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,6}(:\d+)?(\/[-a-zA-Z0-9@:%_+.~#?&/=]*)?$/;

  if (!urlRegex.test(userUrl)) {
    return res.json({ error: 'invalid url' });
  }

  let urlIsValid = false;
  try {
    // Attempt to create a new URL object to check if it's valid
    new URL(userUrl);
    urlIsValid = true;
  } catch (err) {
    urlIsValid = false;
  }

  if (!urlIsValid) {
    return res.json({ error: 'invalid url' });
  }

  // Check if the URL already exists in the database
  const foundUrl = await Url.findOne({ original_url: userUrl });

  if (foundUrl) {
    res.json({
      original_url: foundUrl.original_url,
      short_url: foundUrl.short_url
    });
  } else {
    // Create new short URL based on the number of documents in the collection
    const totalUrls = await Url.countDocuments();

    const newShortUrl = new Url({
      original_url: userUrl,
      short_url: totalUrls + 1
    });

    await newShortUrl.save();

    res.json({
      original_url: newShortUrl.original_url,
      short_url: newShortUrl.short_url
    });
  }
});

app.listen(port, function () {
  console.log('The app is running on port', port);
});
