import DiamondType from "../models/Diamondtype"

export const createDiamondType = async (req, res) => {
  try {
    const diamondType = new DiamondType(req.body)
    await diamondType.save()
    res.status(201).json({ success: true, data: diamondType })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllDiamondTypes = async (req, res) => {
  try {
    const diamondTypes = await DiamondType.find()
    res.status(200).json({ success: true, data: diamondTypes })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getActiveDiamondTypes = async (req, res) => {
  try {
    const diamondTypes = await DiamondType.find({ isActive: true })
    res.status(200).json({ success: true, data: diamondTypes })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateDiamondType = async (req, res) => {
  try {
    const diamondType = await DiamondType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!diamondType) return res.status(404).json({ success: false, message: 'Diamond type not found' })
    res.status(200).json({ success: true, data: diamondType })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteDiamondType = async (req, res) => {
  try {
    const diamondType = await DiamondType.findByIdAndDelete(req.params.id)
    if (!diamondType) return res.status(404).json({ success: false, message: 'Diamond type not found' })
    res.status(200).json({ success: true, message: 'Diamond type deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}