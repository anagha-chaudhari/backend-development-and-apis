require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

if (!process.env.DB_URI) {
    console.error("Missing DB_URI in environment variables.");
    process.exit(1); 
}

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const port = process.env.PORT || 3000;

// Model
const schema = new mongoose.Schema(
    {
        original: { type: String, required: true },
        short: { type: Number, required: true }
    }
);
const Url = mongoose.model('Url', schema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});


app.get("/api/shorturl/:input", (req, res) => {
    const input = parseInt(req.params.input);

    Url.findOne({ short: input }, function (err, data) {
        if (err || data === null) {
            return res.json({ error: "URL NOT FOUND" });
        }
        return res.redirect(data.original);
    });
});

app.post("/api/shorturl", async (req, res) => {
    const bodyUrl = req.body.url;
    const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/);

    if (!bodyUrl.match(urlRegex)) {
        return res.json({ error: "Invalid URL" });
    }

    let index = 1;

    try {
        const lastUrl = await Url.findOne({}).sort({ short: 'desc' }).exec();
        index = lastUrl !== null ? lastUrl.short + 1 : index;

        const newUrl = await Url.findOneAndUpdate(
            { original: bodyUrl },
            { original: bodyUrl, short: index },
            { new: true, upsert: true }
        );

        res.json({
            original_url: bodyUrl,
            short_url: newUrl.short
        });
    } catch (err) {
        console.error("Error during URL processing:", err);
        res.json({ error: "Something went wrong" });
    }
});

app.listen(port, function () {
    console.log(`The app is listening on port ${port}`);
});
