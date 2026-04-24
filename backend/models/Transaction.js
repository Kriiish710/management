import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({

  // ── Diamond details ──────────────────────────────
  shippingNo: { type: String },
  skuNo: { type: String, required: true, unique: true },
  courier: { type: String },
  supplier: { type: String },
  buyerAtSource: { type: String },
  dateOfPurchase: { type: Date },
  shape: { type: String },
  weight: { type: Number },
  certificateNo: { type: String },
  synthesis: { type: String },
  diamondType: { type: String },
  cut: { type: String },
  carat: { type: Number },
  colour: { type: String },
  clarity: { type: String },
  laboratory: { type: String },
  certificateUrl: { type: String },
  location: { type: String },

  // ── Measurements ──────────────────────────
  length: { type: Number },
  width: { type: Number },
  height: { type: Number },

  // ── Purchase & currency ──────────────────────────
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

  // ── Pricing & markup ────────────────────────────
  markup: { type: Number },
  sellPriceLocalCurrency: { type: Number },
  localCurrency: { type: String },
  typeOfExchange: { type: String },
  priceRUB: { type: Number },
  priceUSD: { type: Number },
  pricePerCt: { type: Number },
  rateRUB: { type: Number },

  // ── Inventory ───────────────────────────────────
  status: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
  paymentStatus: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentStatus' },
  warehouse: { type: String },
  inventoryDate: { type: Date },
  inventoryManager: { type: String },
  bank: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },

  // ── Sale ────────────────────────────────────────
  dateOfSale: { type: Date },
  buyerName: { type: String },
  saleAmount: { type: Number },
  saleCurrency: { type: String },
  rateOnDateOfSale: { type: Number },
  saleBaseINR: { type: Number },

  // ── P&L ─────────────────────────────────────────
  marginality: { type: Number },
  actualMarkup: { type: Number },
  manager: { type: String },
  bonusPoints: { type: Number },
  bonusAmount: { type: Number },
  bonusRate: { type: Number },
  bonusInLocalCurrency: { type: Number },

}, { timestamps: true })

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction