USE blinkit_clone;

-- Insert Admin User (password: 'admin123' -> hashed)
-- I will use a simple text for seed, user will need to hash in real app or we provide an already hashed one.
-- Hash for 'admin123' using bcrypt (cost 10): $2b$10$QOOrM6.gK83FId22r3uA/Ou/wXF9S7T5wD3S76u42W5y3Y.kIu7Iq
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin', 'admin@blinkit.com', '$2b$10$QOOrM6.gK83FId22r3uA/Ou/wXF9S7T5wD3S76u42W5y3Y.kIu7Iq', 'admin'),
('John Doe', 'john@example.com', '$2b$10$QOOrM6.gK83FId22r3uA/Ou/wXF9S7T5wD3S76u42W5y3Y.kIu7Iq', 'user');

-- Insert Products
INSERT IGNORE INTO products (name, description, price, category, stock, image) VALUES 
('Amul Taaza Toned Fresh Milk', 'Fresh toned milk, rich in nutrients. Great for daily consumption.', 27.00, 'Dairy', 100, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80'),
('Aashirvaad Shudh Chakki Atta', '100% pure whole wheat atta.', 215.00, 'Groceries', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'),
('Lays India''s Magic Masala', 'Crunchy potato chips with magic masala flavor.', 20.00, 'Snacks', 200, 'https://images.unsplash.com/photo-1566478989037-eade2e594527?w=500&q=80'),
('Coca-Cola Soft Drink', 'Refreshing cola drink.', 40.00, 'Beverages', 150, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80'),
('Maggi 2-Minute Noodles', 'Quick and delicious instant noodles.', 14.00, 'Snacks', 300, 'https://images.unsplash.com/photo-1612929633738-8fe01f746794?w=500&q=80'),
('Onion', 'Fresh onions sourced organically.', 35.00, 'Vegetables', 500, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80'),
('Tomato', 'Farm fresh red tomatoes.', 40.00, 'Vegetables', 400, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80'),
('Surf Excel Easy Wash', 'Detergent powder for tough stain removal.', 120.00, 'Household', 80, 'https://images.unsplash.com/photo-1584820927498-cafe4c158b44?w=500&q=80');
