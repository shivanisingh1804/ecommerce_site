const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

const PORT = process.env.PORT || 3000;
const jwtSecret = 'secret'; // Use a strong secret in production

// Connect to MongoDB
mongoose.connect('mongodb://localhost/ecommerce-site', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// Product Schema and Model
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
});
const Product = mongoose.model('Product', productSchema);

// Order Schema and Model
const orderSchema = new mongoose.Schema({
  userId: String,
  products: Array,
  totalAmount: Number,
  status: { type: String, default: 'Pending' },
});
const Order = mongoose.model('Order', orderSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Access Denied');
  
  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ username, email, password: hashedPassword });
  try {
    const savedUser = await user.save();
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('Email or password is wrong');
  
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send('Invalid password');
  
  const token = jwt.sign({ _id: user._id }, jwtSecret);
  res.header('auth-token', token).send(token);
});

app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.send(products);
});

app.post('/api/order', authenticateToken, async (req, res) => {
  const { products, totalAmount } = req.body;
  const order = new Order({ userId: req.user._id, products, totalAmount });
  try {
    const savedOrder = await order.save();
    res.send(savedOrder);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
