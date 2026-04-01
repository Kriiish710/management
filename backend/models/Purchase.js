import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema({
  diamond: { type: mongoose.Schema.Types.ObjectId, ref: 'Diamond', required: true },
  bank: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },

  supplier: { type: String },
  courier: { type: String },
  buyerAtSource: { type: String },
  dateOfPurchase: { type: Date },
  pricePerCaratUSD: { type: Number },
  gstPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  buyPriceTotal: { type: Number },
  purchaseCurrency: { type: String, default: 'USD' },
  rateAtPurchase: { type: Number },
  basePriceINR: { type: Number },
  correctionPriceUSD: { type: Number },
  actualRate: { type: Number },
  actualPriceINR: { type: Number },
  marketPL: { type: Number },

}, { timestamps: true })

const Purchase = mongoose.model('Purchase', purchaseSchema)

export default Purchase