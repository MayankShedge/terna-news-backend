const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const cookieParser = require('cookie-parser');
const { initCronJobs } = require('./jobs/cronJobs');

dotenv.config();
const app = express();

console.log('The FRONTEND_URL is:', process.env.FRONTEND_URL);

connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

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