const express = require('express');
const { body } = require('express-validator');
const moduleController = require('../controllers/moduleController');
const validate = require('../middleware/validationMiddleware');
const { withModule } = require('../middleware/moduleContext');

const router = express.Router({ mergeParams: true });

router.get('/', moduleController.list);

router.patch(
  '/:moduleId',
  withModule,
  [body('isSelected').isBoolean().withMessage('isSelected doit être booléen')],
  validate,
  moduleController.updateSelection,
);

module.exports = router;
