import Diamond from '../models/Diamond.js'

// Create a new diamond
export const createDiamond = async (req, res) => {
  try {
    const diamond = new Diamond(req.body)
    await diamond.save()
    res.status(201).json({ success: true, data: diamond })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all diamonds
export const getAllDiamonds = async (req, res) => {
  try {
    const diamonds = await Diamond.find()
    res.status(200).json({ success: true, data: diamonds })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single diamond
export const getDiamond = async (req, res) => {
  try {
    const diamond = await Diamond.findById(req.params.id)
    if (!diamond) return res.status(404).json({ success: false, message: 'Diamond not found' })
    res.status(200).json({ success: true, data: diamond })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update diamond
export const updateDiamond = async (req, res) => {
  try {
    const diamond = await Diamond.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!diamond) return res.status(404).json({ success: false, message: 'Diamond not found' })
    res.status(200).json({ success: true, data: diamond })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete diamond
export const deleteDiamond = async (req, res) => {
  try {
    const diamond = await Diamond.findByIdAndDelete(req.params.id)
    if (!diamond) return res.status(404).json({ success: false, message: 'Diamond not found' })
    res.status(200).json({ success: true, message: 'Diamond deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}