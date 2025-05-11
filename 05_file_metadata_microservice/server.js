const express = require('express');
const app = express();
const multer = require('multer');
const cors = require('cors');
app.use(cors());
const path = require('path');

app.use('/public', express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Use of multer for file upload
const upload = multer({ dest: 'uploads/' });


app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  const { originalname, mimetype, size } = req.file;
  res.json({
    name: originalname,
    type: mimetype,
    size: size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The app is running on port ${PORT}`);
});
