const crypto = require('crypto');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  sendEmail, 
  sendWelcomeEmail, 
  sendVerificationEmail,
  sendPasswordResetEmail 
} = require('../utils/sendEmail');

const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, adminCode } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let isAdmin = false;
    if (adminCode && adminCode === process.env.ADMIN_REGISTRATION_KEY) {
      isAdmin = true;
    }
    
    user = new User({
      name,
      email,
      password,
      isAdmin,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const verifyEmail = async (req, res) => {
    try {
        const verificationToken = req.params.token;
        const user = await User.findOne({ verificationToken });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Send welcome email after verification
        try {
          await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
          console.error('Welcome email failed:', emailError);
        }

        res.status(200).json({ 
          success: true, 
          message: 'Email verified successfully! Welcome email sent. You can now log in.' 
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id, 
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error sending email. Please try again.' });
    }

    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email.' 
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired.' 
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successful! You can now log in with your new password.' 
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  forgotPassword,  
  resetPassword    
};