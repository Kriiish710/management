import mongoose from 'mongoose'

const pricingSchema = new mongoose.Schema({
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond', required: true },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
  bank: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },

  markup: { type: Number },
  sellPriceLocalCurrency: { type: Number },
  localCurrency: { type: String },
  typeOfExchange: { type: String },
  priceRUB: { type: Number },
  priceUSD: { type: Number },
  pricePerCt: { type: Number },
  rateRUB: { type: Number },

}, { timestamps: true })

const Pricing = mongoose.model('Pricing', pricingSchema)

export default Pricing