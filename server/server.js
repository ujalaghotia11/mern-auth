require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. CORS Update: Localhost (5173, 5174, 3000) + GitHub Pages sabhi ko allow karein
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use('/api/medicines', medicineRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MONGODB connected successfully'))
  .catch((err) => console.log('MONGODB connection failed:', err));

app.get('/', (req, res) => {
  res.send('Server is running properly!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));