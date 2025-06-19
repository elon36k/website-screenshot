const Joi = require('joi');

const screenshotSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'URL 必须是有效的 HTTP 或 HTTPS 地址',
      'any.required': 'URL 参数是必需的'
    }),
  
  width: Joi.number()
    .integer()
    .min(320)
    .max(1920)
    .default(1200)
    .messages({
      'number.base': '宽度必须是数字',
      'number.integer': '宽度必须是整数',
      'number.min': '宽度不能小于 320px',
      'number.max': '宽度不能大于 1920px'
    }),
  
  height: Joi.number()
    .integer()
    .min(240)
    .max(1080)
    .default(800)
    .messages({
      'number.base': '高度必须是数字',
      'number.integer': '高度必须是整数',
      'number.min': '高度不能小于 240px',
      'number.max': '高度不能大于 1080px'
    }),
  
  fullPage: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'fullPage 必须是布尔值'
    })
});

const validateScreenshotRequest = (req, res, next) => {
  const { error, value } = screenshotSchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: '请求参数验证失败',
      details: errors
    });
  }

  req.validatedQuery = value;
  next();
};

module.exports = {
  validateScreenshotRequest
};
