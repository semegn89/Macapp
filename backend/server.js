const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/docs', require('./routes/docsRoutes'));

app.get('/', (req, res) => res.json({ message: 'API is running' }));

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server started on port ${PORT}`)))
  .catch((err) => console.error('MongoDB connect error', err));