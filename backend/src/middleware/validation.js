const Joi = require('joi');

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      console.error(`[Validation Error] ${req.method} ${req.url}: ${errorMessage}`);
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessage
      });
    }

    // Replace request body with validated (and potentially stripped) value
    req.body = value;
    next();
  };
};

module.exports = {
  validateBody
};
