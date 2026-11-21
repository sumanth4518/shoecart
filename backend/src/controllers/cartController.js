const pool = require('../config/db');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const query = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    const [cartItems] = await pool.query(query, [req.user.id]);
    res.json(cartItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400);
      throw new Error('Please provide productId and quantity');
    }

    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existing.length > 0) {
      // Update quantity
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [existing[0].quantity + quantity, existing[0].id]
      );
    } else {
      // Insert new item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, productId, quantity]
      );
    }

    res.status(200).json({ message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
