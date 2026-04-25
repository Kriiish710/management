import express from 'express'
import { createDiamondType, getAllDiamondTypes, getActiveDiamondTypes, updateDiamondType, deleteDiamondType } from '../controllers/diamondTypeController.js'

const router = express.Router()

router.post('/', createDiamondType)
router.get('/', getAllDiamondTypes)
router.get('/active', getActiveDiamondTypes)
router.put('/:id', updateDiamondType)
router.delete('/:id', deleteDiamondType)

export default router