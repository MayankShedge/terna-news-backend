const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const cookieParser = require('cookie-parser');
const { initCronJobs } = require('./jobs/cronJobs');

dotenv.config();
const app = express();

console.log('The FRONTEND_URL is:', process.env.FRONTEND_URL);

connectDB();

app.use(cors({
  origin: "https://terna-news-frontend.vercel.app",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// Rate Limiting
// Global limiter — applies to every route
// 100 requests per 15 minutes per IP — generous enough for normal browsing
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,  
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again after 15 minutes.' },
});

app.use(globalLimiter); 

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);


app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initCronJobs();
});