const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Le nom d’utilisateur doit contenir au moins 3 caractères'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  ],
  validate,
  authController.register,
);

router.post(
  '/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  validate,
  authController.login,
);

router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
