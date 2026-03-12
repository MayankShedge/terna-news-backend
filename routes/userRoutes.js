const express = require('express');
const { check } = require('express-validator');

const { 
  registerUser, 
  loginUser, 
  verifyEmail,
  forgotPassword,   
  resetPassword     
} = require('../controllers/userController');

const router = express.Router();

router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], registerUser);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], loginUser);

router.get('/verify/:token', verifyEmail);

router.post('/forgot-password', [
  check('email', 'Please include a valid email').isEmail()
], forgotPassword);

router.post('/reset-password/:token', [
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], resetPassword);

router.post('/admin/register', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], (req, res) => {
  req.body.userType = 'admin';
  registerUser(req, res);
});

module.exports = router;