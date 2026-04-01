import express from 'express'
import { createPL, getAllPL, getPL, getPLByManager, updatePL, deletePL } from '../controllers/plController.js'

const router = express.Router()

router.post('/', createPL)
router.get('/', getAllPL)
router.get('/manager/:manager', getPLByManager)
router.get('/:id', getPL)
router.put('/:id', updatePL)
router.delete('/:id', deletePL)

export default router