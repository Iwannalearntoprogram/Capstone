require('dotenv').config(); // Load .env first
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;


app.use(express.json());

// MongoDB conn
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// routesee
app.get('/', (req, res) => {
  res.send('Server with MongoDB and .env is working!');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
