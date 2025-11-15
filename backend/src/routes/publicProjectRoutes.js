const express = require('express');
const publicProjectController = require('../controllers/publicProjectController');
const { withPublicProject } = require('../middleware/publicProjectContext');

const router = express.Router();

router.get('/:token/ics', withPublicProject, publicProjectController.exportIcs);

module.exports = router;
