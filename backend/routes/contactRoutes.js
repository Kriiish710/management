import express from 'express'
import { createContact, getAllContacts, getContact, getContactsByType, updateContact, deleteContact } from '../controllers/contactController.js'

const router = express.Router()

router.post('/', createContact)
router.get('/', getAllContacts)
router.get('/type/:type', getContactsByType)
router.get('/:id', getContact)
router.put('/:id', updateContact)
router.delete('/:id', deleteContact)

export default router