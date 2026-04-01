import mongoose from 'mongoose'

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },

  usdToInr: { type: Number, required: true },
  usdToRub: { type: Number, required: true },
  inrToRub: { type: Number, required: true },

  isActive: { type: Boolean, default: true },

}, { timestamps: true })

const Bank = mongoose.model('Bank', bankSchema)

export default Bank