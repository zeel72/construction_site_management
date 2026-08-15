const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: function (origin, callback) {
    console.log("CORS origin called with:", origin);
    callback(null, true);
  },
  credentials: true,
}));
app.post('/test', (req, res) => res.json({ok: true}));
app.listen(5002, () => console.log('started'));
