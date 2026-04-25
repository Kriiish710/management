import mongoose from 'mongoose'

const diamondTypeSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true },
  color: { type: String, default: '#64748b' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

const DiamondType =
  mongoose.models.DiamondType ||
  mongoose.model('DiamondType', diamondTypeSchema)

export default DiamondType