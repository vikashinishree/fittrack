import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import auth from './routes/auth.js';
import workouts from './routes/workouts.js';
import logs from './routes/logs.js';

const app = express();
app.use(cors(), express.json());
app.use('/api/auth', auth);
app.use('/api/workouts', workouts);
app.use('/api/logs', logs);

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
