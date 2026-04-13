import express from 'express'
import { createStatus, getAllStatuses, getActiveStatuses, updateStatus, deleteStatus } from '../controllers/statusController.js'

const router = express.Router()

router.post('/', createStatus)
router.get('/', getAllStatuses)
router.get('/active', getActiveStatuses)
router.put('/:id', updateStatus)
router.delete('/:id', deleteStatus)

export default router