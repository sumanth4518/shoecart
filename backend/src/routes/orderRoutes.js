const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .put(protect, admin, updateOrder);

module.exports = router;
