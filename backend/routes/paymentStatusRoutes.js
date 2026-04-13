import express from 'express'
import { createPaymentStatus, getAllPaymentStatuses, getActivePaymentStatuses, updatePaymentStatus, deletePaymentStatus } from '../controllers/paymentStatusController.js'

const router = express.Router()

router.post('/', createPaymentStatus)
router.get('/', getAllPaymentStatuses)
router.get('/active', getActivePaymentStatuses)
router.put('/:id', updatePaymentStatus)
router.delete('/:id', deletePaymentStatus)

export default router