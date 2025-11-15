const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const payload = await authService.register({ username, email, password });
  res.status(201).json(payload);
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const payload = await authService.login({ username, password });
  res.json(payload);
});

const profile = asyncHandler(async (req, res) => {
  const profileData = await authService.profile(req.user.username);
  res.json(profileData);
});

module.exports = {
  register,
  login,
  profile,
};
