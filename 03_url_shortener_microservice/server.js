require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error: ", err));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', (req, res) => {
  res.send('URL Shortener with MongoDB');
});

app.post('/api/shorturl', async (req, res) => {
  const userUrl = req.body.url;

  let urlIsValid = false;
  let hostname;

  try {
    const parsedUrl = new URL(userUrl);
    hostname = parsedUrl.hostname;
    urlIsValid = true;
  } catch (err) {
    urlIsValid = false;
  }

  if (!urlIsValid) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const foundUrl = await Url.findOne({ original_url: userUrl });

    if (foundUrl) {
      res.json({
        original_url: foundUrl.original_url,
        short_url: foundUrl.short_url
      });
    } else {
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
});

app.get('/api/shorturl/:short', async (req, res) => {
  const shortId = parseInt(req.params.short);
  const foundUrl = await Url.findOne({ short_url: shortId });

  if (foundUrl) {
    res.redirect(foundUrl.original_url);
  } else {
    res.status(404).send('Short URL not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('App is running on port', PORT);
});
