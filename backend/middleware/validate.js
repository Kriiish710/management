import mongoose from 'mongoose'

export const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }
  next()
}

export const validateBody = (requiredFields) => (req, res, next) => {
  const missing = requiredFields.filter(field => !req.body[field])
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    })
  }
  next()
}
