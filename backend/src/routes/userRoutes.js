const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/me', userController.me);

router.put(
  '/me',
  [
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  ],
  validate,
  userController.updateMe,
);

router.delete('/me', userController.removeMe);

module.exports = router;
