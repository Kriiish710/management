import express from 'express'
import { createTransaction, getAllTransactions, getTransaction, updateTransaction, deleteTransaction } from '../controllers/transactionController.js'

const router = express.Router()

router.post('/', createTransaction)
router.get('/', getAllTransactions)
router.get('/:id', getTransaction)
router.put('/:id', updateTransaction)
router.delete('/:id', deleteTransaction)

export default router