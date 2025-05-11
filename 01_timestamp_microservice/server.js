const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

app.get('/', (req,res) => {
    res.send('Timestamp Microservice');
});

app.get('/api/:date?', (req, res) => {
    const dateParam = req.params.date;

    let date;
    if(!dateParam) {
        date = new Date();
    }
    else if (!isNaN(dateParam)) {
    date = new Date(parseInt(dateParam));
  } else {
    date = new Date(dateParam);
  }

  if (date.toString() === 'Invalid Date') {
    res.json({ error: 'Invalid Date' });
  } else {
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});