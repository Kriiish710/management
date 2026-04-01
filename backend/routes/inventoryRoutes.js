import express from 'express'
import { createInventory, getAllInventory, getInventory, updateInventoryStatus, getInventoryByStatus, deleteInventory } from '../controllers/inventoryController.js'

const router = express.Router()

router.post('/', createInventory)
router.get('/', getAllInventory)
router.get('/status/:status', getInventoryByStatus)
router.get('/:id', getInventory)
router.put('/:id', updateInventoryStatus)
router.delete('/:id', deleteInventory)

export default router