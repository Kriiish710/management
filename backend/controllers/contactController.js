import Contact from '../models/Contact.js'

// Create a new contact
export const createContact = async (req, res) => {
  try {
    const contact = new Contact(req.body)
    await contact.save()
    res.status(201).json({ success: true, data: contact })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all contacts
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
    res.status(200).json({ success: true, data: contacts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get contacts by type
export const getContactsByType = async (req, res) => {
  try {
    const contacts = await Contact.find({ type: req.params.type })
    res.status(200).json({ success: true, data: contacts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single contact
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
    res.status(200).json({ success: true, data: contact })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update contact
export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
    res.status(200).json({ success: true, data: contact })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
    res.status(200).json({ success: true, message: 'Contact deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
