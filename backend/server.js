require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const { authenticateToken, authorizeAdmin } = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

// Placeholder budget routes protected by admin middleware
const budgetRouter = express.Router();

budgetRouter.use(authenticateToken);
budgetRouter.use(authorizeAdmin);

budgetRouter.get('/', (req, res) => {
  res.json({ message: 'Welcome to the admin-only budget API' });
});

app.use('/api/budget', budgetRouter);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
})
.catch(err => console.error('❌ MongoDB connection error:', err));
