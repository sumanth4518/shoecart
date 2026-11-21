const pool = require('../config/db');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { orderItems, address, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    await connection.beginTransaction();

    // 1. Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_price, address, status) VALUES (?, ?, ?, ?)',
      [req.user.id, totalPrice, address, 'pending']
    );

    const orderId = orderResult.insertId;

    // 2. Insert order items
    for (const item of orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      
      // Reduce stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 3. Clear cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get user orders (or all orders if admin)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    let ordersQuery;
    let params = [];

    if (req.user.role === 'admin') {
      ordersQuery = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC';
    } else {
      ordersQuery = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
      params.push(req.user.id);
    }

    const [orders] = await pool.query(ordersQuery, params);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        'SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;

    const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    if (order.length === 0) {
      res.status(404);
      throw new Error('Order not found');
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    res.json({ message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrder,
};
