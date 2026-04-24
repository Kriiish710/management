import mongoose from 'mongoose'

const diamondSchema = new mongoose.Schema({
  skuNo: { type: String, required: true, unique: true },
  shippingNo: { type: String, required: true },

  // Physical details
  shape: { type: String },
  weight: { type: Number },
  carat: { type: Number },
  cut: { type: String },
  colour: { type: String },
  clarity: { type: String },
  synthesis: { type: String }, // CVD, natural etc.
  diamondType: { type: String }, // Loose, Mounted etc.
  measurement: { type: String },

  // Certificate
  certificateNo: { type: String },
  laboratory: { type: String }, // IGI, GIA etc.
  certificateUrl: { type: String },

}, { timestamps: true })

const Diamond = mongoose.model('Diamond', diamondSchema)

export default Diamond