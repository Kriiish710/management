import PaymentStatus from '../models/PaymentStatus.js'

export const createPaymentStatus = async (req, res) => {
  try {
    const paymentStatus = new PaymentStatus(req.body)
    await paymentStatus.save()
    res.status(201).json({ success: true, data: paymentStatus })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllPaymentStatuses = async (req, res) => {
  try {
    const paymentStatuses = await PaymentStatus.find()
    res.status(200).json({ success: true, data: paymentStatuses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getActivePaymentStatuses = async (req, res) => {
  try {
    const paymentStatuses = await PaymentStatus.find({ isActive: true })
    res.status(200).json({ success: true, data: paymentStatuses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updatePaymentStatus = async (req, res) => {
  try {
    const paymentStatus = await PaymentStatus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!paymentStatus) return res.status(404).json({ success: false, message: 'Payment status not found' })
    res.status(200).json({ success: true, data: paymentStatus })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deletePaymentStatus = async (req, res) => {
  try {
    const paymentStatus = await PaymentStatus.findByIdAndDelete(req.params.id)
    if (!paymentStatus) return res.status(404).json({ success: false, message: 'Payment status not found' })
    res.status(200).json({ success: true, message: 'Payment status deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}