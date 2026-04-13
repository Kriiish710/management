import mongoose from 'mongoose'

const paymentStatusSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true },
  color: { type: String, default: '#64748b' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

const PaymentStatus = mongoose.model('PaymentStatus', paymentStatusSchema)
  
export default PaymentStatus