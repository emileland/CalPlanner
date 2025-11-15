const express = require('express');
const { body } = require('express-validator');
const calendarController = require('../controllers/calendarController');
const moduleRoutes = require('./moduleRoutes');
const validate = require('../middleware/validationMiddleware');
const { withCalendar } = require('../middleware/calendarContext');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(calendarController.list)
  .post(
    [
      body('url').isURL().withMessage('URL du calendrier invalide'),
      body('type').isBoolean().withMessage('type doit être booléen'),
      body('label').optional().isLength({ min: 2 }).withMessage('Le libellé est trop court'),
    ],
    validate,
    calendarController.create,
  );

router.post('/:calendarId/sync', withCalendar, calendarController.sync);

router
  .route('/:calendarId')
  .all(withCalendar)
  .delete(calendarController.remove)
  .patch(
    [
      body('label')
        .customSanitizer((value) => {
          if (typeof value !== 'string') {
            return null;
          }
          const trimmed = value.trim();
          return trimmed.length ? trimmed : null;
        })
        .optional({ nullable: true })
        .isLength({ min: 2 })
        .withMessage('Le libellé est trop court'),
      body('type')
        .optional()
        .isBoolean()
        .withMessage('type doit être booléen')
        .toBoolean(),
    ],
    validate,
    calendarController.update,
  );

router.use('/:calendarId/modules', withCalendar, moduleRoutes);

module.exports = router;
