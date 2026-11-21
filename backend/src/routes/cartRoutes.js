const express = require('express');
const router = express.Router();
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCart);

router.post('/add', protect, addToCart);
router.delete('/remove/:productId', protect, removeFromCart);

module.exports = router;
