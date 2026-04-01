import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['supplier', 'buyer', 'courier', 'manager'],
    required: true
  },
  company: { type: String },
  location: { type: String },
  phone: { type: String },
  email: { type: String },

}, { timestamps: true })

const Contact = mongoose.model('Contact', contactSchema)

export default Contact