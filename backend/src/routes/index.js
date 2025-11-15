const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', authMiddleware, userRoutes);
router.use('/projects', authMiddleware, projectRoutes);

module.exports = router;
