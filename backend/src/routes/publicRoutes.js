const express = require('express');
const publicProjectRoutes = require('./publicProjectRoutes');

const router = express.Router();

router.use('/projects', publicProjectRoutes);

module.exports = router;
