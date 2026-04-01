import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema({
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond', required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },

  status: {
    type: String,
    enum: ['Stock', 'Hold', 'Inventory', 'Sold', 'Delivery', 'Memo', 'Invoice', 'Local office'],
    default: 'Stock'
  },
  paymentStatus: { type: String },
  warehouse: { type: String },
  location: { type: String },
  inventoryDate: { type: Date },
  inventoryManager: { type: String },

}, { timestamps: true })

const Inventory = mongoose.model('Inventory', inventorySchema)

export default Inventory