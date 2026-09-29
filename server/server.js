require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
// const authRoutes = require('./routes/auth');
// app.use('/api/auth',authRoutes);
mongoose.connect(process.env.MONGO_URI).then(()=>console.log('MONGODB connected successfully'))
.catch((err)=>console.log('MONGODB connection failed:',err));

app.get('/',(req,res)=>{
    res.send('Server is running properly!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));
