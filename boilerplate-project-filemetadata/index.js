var express = require('express');
var cors = require('cors');
let multer = require("multer");
require('dotenv').config()

var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  },
});

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Initialize multer with storage
const upload = multer({ storage });

// Route to handle single file upload
app.post('/api/upload', upload.single('upfile'), (req, res) => {
  const { size, originalname, mimetype } = req.file
  res.send(`File uploaded successfully: ${req.file.filename}`);
  res.send(200).json({
    name: originalname,
    type:mimetype,
    size
  })
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
