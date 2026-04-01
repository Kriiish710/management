import Bank from '../models/Bank.js'

// Create a new bank
export const createBank = async (req, res) => {
  try {
    const bank = new Bank(req.body)
    await bank.save()
    res.status(201).json({ success: true, data: bank })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all banks
export const getAllBanks = async (req, res) => {
  try {
    const banks = await Bank.find()
    res.status(200).json({ success: true, data: banks })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single bank
export const getBank = async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id)
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
    res.status(200).json({ success: true, data: bank })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update bank rates
export const updateBank = async (req, res) => {
  try {
    const bank = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
    res.status(200).json({ success: true, data: bank })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete bank
export const deleteBank = async (req, res) => {
  try {
    const bank = await Bank.findByIdAndDelete(req.params.id)
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
    res.status(200).json({ success: true, message: 'Bank deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get active banks only
export const getActiveBanks = async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true })
    res.status(200).json({ success: true, data: banks })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}