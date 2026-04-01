import Inventory from '../models/Inventory.js'

// Create inventory record
export const createInventory = async (req, res) => {
  try {
    const inventory = new Inventory(req.body)
    await inventory.save()
    res.status(201).json({ success: true, data: inventory })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all inventory records
export const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate('diamond')
      .populate('purchase')
    res.status(200).json({ success: true, data: inventory })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single inventory record
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('diamond')
      .populate('purchase')
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory not found' })
    res.status(200).json({ success: true, data: inventory })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update inventory status
export const updateInventoryStatus = async (req, res) => {
  try {
    const { status, inventoryManager } = req.body

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        status,
        inventoryManager,
        inventoryDate: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('diamond')
      .populate('purchase')

    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory not found' })
    res.status(200).json({ success: true, data: inventory })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get inventory by status
export const getInventoryByStatus = async (req, res) => {
  try {
    const inventory = await Inventory.find({ status: req.params.status })
      .populate('diamond')
      .populate('purchase')
    res.status(200).json({ success: true, data: inventory })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Delete inventory record
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id)
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory not found' })
    res.status(200).json({ success: true, message: 'Inventory deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}