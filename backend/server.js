const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Set JWT_SECRET if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_super_secret_jwt_key_for_saas_crm_project_2024';
}

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection - fix the connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/admins', require('./routes/admin'));
app.use('/api/admin', require('./routes/adminUsers'));
app.use('/api/plans', require('./routes/plan'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/payment-gateways', require('./routes/paymentGateway'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/chat', require('./routes/chat'));

app.get('/', (req, res) => {
  res.send('SaaS CRM API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));