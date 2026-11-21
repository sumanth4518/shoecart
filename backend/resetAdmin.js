const bcrypt = require('bcrypt');
const pool = require('./src/config/db');

const resetAdmin = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    console.log('New hash generated:', hashedPassword);

    const [result] = await pool.query(
      "UPDATE users SET password = ? WHERE email = 'admin@blinkit.com'",
      [hashedPassword]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Found admin@blinkit.com and successfully updated password to "admin123".');
    } else {
      console.log('⚠️ Could not find "admin@blinkit.com". Attempting to insert...');
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@blinkit.com', ?, 'admin')",
        [hashedPassword]
      );
      console.log('✅ Admin user created with password "admin123"!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
};

resetAdmin();
