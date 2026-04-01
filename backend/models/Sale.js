import mongoose from 'mongoose'

const saleSchema = new mongoose.Schema({
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond', required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
  bank: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },

  dateOfSale: { type: Date },
  buyerName: { type: String },
  saleAmount: { type: Number },
  saleCurrency: { type: String },
  rateOnDateOfSale: { type: Number },
  saleBaseINR: { type: Number },

}, { timestamps: true })

const Sale = mongoose.model('Sale', saleSchema)

export default Sale