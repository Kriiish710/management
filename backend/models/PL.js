import mongoose from 'mongoose'

const plSchema = new mongoose.Schema({
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond', required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },

  marginality: { type: Number },
  actualMarkup: { type: Number },
  manager: { type: String },
  bonusPoints: { type: Number },
  bonusAmount: { type: Number },
  bonusRate: { type: Number },
  bonusInLocalCurrency: { type: Number },

}, { timestamps: true })

const PL = mongoose.model('PL', plSchema)

export default PL
