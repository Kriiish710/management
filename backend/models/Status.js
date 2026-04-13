import mongoose from 'mongoose'

const statusSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true },
  color: { type: String, default: '#64748b' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

const Status = mongoose.model('Status', statusSchema)

export default Status