import express from 'express'
import { createBank, getAllBanks, getBank, updateBank, deleteBank, getActiveBanks } from '../controllers/bankController.js'

const router = express.Router()

router.post('/', createBank)
router.get('/', getAllBanks)
router.get('/active', getActiveBanks)
router.get('/:id', getBank)
router.put('/:id', updateBank)
router.delete('/:id', deleteBank)

export default router