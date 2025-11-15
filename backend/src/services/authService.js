const ApiError = require('../utils/ApiError');
const userService = require('./userService');
const { comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const buildPayload = (user) => ({
  token: signToken({ username: user.username, email: user.email }),
  user,
});

const register = async ({ username, email, password }) => {
  const existingUser = await userService.getWithPassword(username);
  if (existingUser) {
    throw new ApiError(409, 'Ce nom d’utilisateur est déjà pris');
  }
  const existingEmail = await userService.findByEmail(email);
  if (existingEmail) {
    throw new ApiError(409, 'Cet email est déjà utilisé');
  }
  const user = await userService.create({ username, email, password });
  return buildPayload(user);
};

const login = async ({ username, password }) => {
  const user = await userService.getWithPassword(username);
  if (!user) {
    throw new ApiError(401, 'Identifiants invalides');
  }
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Identifiants invalides');
  }
  return buildPayload({
    username: user.username,
    email: user.email,
  });
};

const profile = async (username) => userService.getByUsername(username);

module.exports = {
  register,
  login,
  profile,
};
