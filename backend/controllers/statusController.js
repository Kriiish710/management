import Status from '../models/Status.js'



export const createStatus = async (req, res) => {
  try {
    const status = new Status(req.body)
    await status.save()
    res.status(201).json({ success: true, data: status })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
    res.status(200).json({ success: true, data: statuses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getActiveStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({ isActive: true })
    res.status(200).json({ success: true, data: statuses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const status = await Status.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' })
    res.status(200).json({ success: true, data: status })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id)
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' })
    res.status(200).json({ success: true, message: 'Status deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}