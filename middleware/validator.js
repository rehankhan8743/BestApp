const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

const createThreadValidator = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID required'),
  body('type')
    .optional()
    .isIn(['discussion', 'request', 'release', 'guide']),
  handleValidationErrors
];

const createPostValidator = [
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content cannot be empty'),
  body('thread')
    .isMongoId()
    .withMessage('Valid thread ID required'),
  handleValidationErrors
];

const searchValidator = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  handleValidationErrors
];

module.exports = {
  registerValidator,
  loginValidator,
  createThreadValidator,
  createPostValidator,
  searchValidator,
  handleValidationErrors
};
