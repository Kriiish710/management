import express from 'express'
import { createDiamond, getAllDiamonds, getDiamond, updateDiamond, deleteDiamond } from '../controllers/diamondController.js'

const router = express.Router()

router.post('/', createDiamond)
router.get('/', getAllDiamonds)
router.get('/:id', getDiamond)
router.put('/:id', updateDiamond)
router.delete('/:id', deleteDiamond)

export default router