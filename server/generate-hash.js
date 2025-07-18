import bcrypt from 'bcryptjs';

const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('Hash:', hash);
  }
});
