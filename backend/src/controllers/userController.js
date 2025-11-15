const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const me = asyncHandler(async (req, res) => {
  const user = await userService.getByUsername(req.user.username);
  res.json(user);
});

const updateMe = asyncHandler(async (req, res) => {
  const updated = await userService.update(req.user.username, req.body);
  res.json(updated);
});

const removeMe = asyncHandler(async (req, res) => {
  await userService.remove(req.user.username);
  res.status(204).send();
});

module.exports = {
  me,
  updateMe,
  removeMe,
};
