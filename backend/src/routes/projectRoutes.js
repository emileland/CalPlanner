const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const calendarRoutes = require('./calendarRoutes');
const validate = require('../middleware/validationMiddleware');
const { withProject } = require('../middleware/projectContext');

const router = express.Router();

const projectValidators = [
  body('name').notEmpty().withMessage('Le nom du projet est requis'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date doit être au format ISO8601'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date doit être au format ISO8601'),
];

router
  .route('/')
  .get(projectController.list)
  .post(projectValidators, validate, projectController.create);
router.post('/import-config', projectController.importConfig);

router
  .route('/:projectId')
  .all(withProject)
  .get(projectController.getById)
  .put(projectValidators, validate, projectController.update)
  .delete(projectController.remove);

router.get('/:projectId/events', withProject, projectController.listEvents);
router.get('/:projectId/ics', withProject, projectController.exportIcs);
router.get('/:projectId/config', withProject, projectController.exportConfig);
router.post('/:projectId/ics/token', withProject, projectController.regenerateIcsToken);

router.use('/:projectId/calendars', withProject, calendarRoutes);

module.exports = router;
