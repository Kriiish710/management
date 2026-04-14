import Transaction from '../models/Transaction.js'
import Diamond from '../models/Diamond.js'
import Bank from '../models/Bank.js'
import Status from '../models/Status.js'
import PaymentStatus from '../models/PaymentStatus.js'
import Purchase from '../models/Purchase.js'
import Sale from '../models/Sale.js'
import Pricing from '../models/Pricing.js'
import PL from '../models/PL.js'
import mongoose from 'mongoose'

// Safe number helper — returns undefined if value is missing or NaN
const safeNum = (val) => {
  if (val === undefined || val === null || val === '') return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

// Find a bank by flexible name match
const findBankByName = async (nameStr) => {
  if (!nameStr) return null
  const clean = String(nameStr).trim().toLowerCase()
  const allBanks = await Bank.find({ isActive: true })
  let match = allBanks.find(b => b.name.toLowerCase() === clean)
  if (match) return match
  match = allBanks.find(b =>
    b.name.toLowerCase().includes(clean) || clean.includes(b.name.toLowerCase())
  )
  return match || null
}

// Resolve status and payment status ObjectIds
const resolveStatuses = async (statusVal, paymentStatusVal) => {
  const result = {}

  if (statusVal !== undefined) {
    if (mongoose.Types.ObjectId.isValid(statusVal)) {
      const exists = await Status.findById(statusVal)
      if (!exists) throw new Error('Invalid status')
      result.status = exists._id
    } else if (statusVal) {
      const statusDoc = await Status.findOne({ label: statusVal })
      if (!statusDoc) throw new Error('Invalid status')
      result.status = statusDoc._id
    } else {
      result.status = null
    }
  }

  if (paymentStatusVal !== undefined) {
    if (mongoose.Types.ObjectId.isValid(paymentStatusVal)) {
      const exists = await PaymentStatus.findById(paymentStatusVal)
      if (!exists) throw new Error('Invalid payment status')
      result.paymentStatus = exists._id
    } else if (paymentStatusVal) {
      const paymentStatusDoc = await PaymentStatus.findOne({ label: paymentStatusVal })
      if (!paymentStatusDoc) throw new Error('Invalid payment status')
      result.paymentStatus = paymentStatusDoc._id
    } else {
      result.paymentStatus = null
    }
  }

  return result
}

const calculateTransactionFields = async (data) => {
  const {
    typeOfExchange,
    pricePerCaratUSD,
    weight,
    gstPercent,
    saleAmount,
    bonusPoints,
    markup,
  } = data

  let rateAtPurchase = safeNum(data.rateAtPurchase)
  let rateRUB = safeNum(data.rateRUB)
  let bonusRate = safeNum(data.bonusRate)
  let resolvedBankId = null

  const bankId = data.bank || data.typeOfExchange
  if (bankId && mongoose.Types.ObjectId.isValid(bankId)) {
    const bank = await Bank.findById(bankId)
    if (bank) {
      rateAtPurchase = bank.usdToInr
      rateRUB = bank.usdToRub
      bonusRate = bank.inrToRub
      resolvedBankId = bank._id
    }
  } else if (typeOfExchange && typeof typeOfExchange === 'string') {
    const bank = await findBankByName(typeOfExchange)
    if (bank) {
      rateAtPurchase = bank.usdToInr
      rateRUB = bank.usdToRub
      bonusRate = bank.inrToRub
      resolvedBankId = bank._id
    }
  }

  const _weight = safeNum(weight)
  const _pricePct = safeNum(pricePerCaratUSD)
  const _gstPct = safeNum(gstPercent) ?? 0
  const _markup = safeNum(markup)
  const _bonusPts = safeNum(bonusPoints) ?? 0
  const _saleAmount = safeNum(saleAmount)

  const correctionPriceUSD = safeNum(data.correctionPriceUSD) ?? _pricePct
  const actualRate = safeNum(data.actualRate) ?? rateAtPurchase
  const rateOnDateOfSale = safeNum(data.rateOnDateOfSale)

  const gstAmount = (_weight != null && _pricePct != null)
    ? _weight * _pricePct * (_gstPct / 100)
    : undefined

  const buyPriceTotal = (_weight != null && _pricePct != null)
    ? _weight * _pricePct + (gstAmount ?? 0)
    : undefined

  const basePriceINR = (buyPriceTotal != null && rateAtPurchase != null)
    ? buyPriceTotal * rateAtPurchase
    : undefined

  const actualPriceINR = (correctionPriceUSD != null && _weight != null && actualRate != null)
    ? correctionPriceUSD * _weight * actualRate
    : undefined

  const marketPL = (actualPriceINR != null && basePriceINR != null)
    ? actualPriceINR - basePriceINR
    : undefined

  const sellPriceLocalCurrency = (actualPriceINR != null && bonusRate != null && _markup != null)
    ? (actualPriceINR / bonusRate) * (1 + _markup)
    : undefined

  const priceRUB = (sellPriceLocalCurrency != null && bonusRate != null)
    ? Math.ceil((sellPriceLocalCurrency * bonusRate) / 100) * 100
    : undefined

  const priceUSD = (sellPriceLocalCurrency != null && rateAtPurchase != null)
    ? sellPriceLocalCurrency / rateAtPurchase
    : undefined

  const pricePerCt = (priceUSD != null && _weight != null)
    ? priceUSD / _weight
    : undefined

  const saleBaseINR = (_saleAmount != null && rateOnDateOfSale != null)
    ? _saleAmount * rateOnDateOfSale
    : undefined

  const marginality = (saleBaseINR != null && basePriceINR != null)
    ? saleBaseINR - basePriceINR
    : undefined

  const actualMarkup = (saleBaseINR != null && basePriceINR != null && basePriceINR !== 0)
    ? saleBaseINR / (basePriceINR / 100) - 100
    : undefined

  const bonusAmount = (actualPriceINR != null)
    ? (actualPriceINR * _bonusPts) / 100
    : undefined

  const bonusInLocalCurrency = (bonusAmount != null && bonusRate != null)
    ? bonusAmount / bonusRate
    : undefined

  const computed = {
    rateAtPurchase, rateRUB, bonusRate, gstAmount, buyPriceTotal,
    basePriceINR, correctionPriceUSD, actualRate, actualPriceINR, marketPL,
    sellPriceLocalCurrency, priceRUB, priceUSD, pricePerCt, rateOnDateOfSale,
    saleBaseINR, marginality, actualMarkup, bonusAmount, bonusInLocalCurrency,
    bank: resolvedBankId,
  }

  Object.keys(computed).forEach(k => {
    if (computed[k] === undefined || (typeof computed[k] === 'number' && isNaN(computed[k]))) {
      delete computed[k]
    }
  })

  return computed
}

// ─────────────────────────────────────────────────────────────────────────────
// Build documents from a saved Transaction
// ─────────────────────────────────────────────────────────────────────────────

const buildDiamondFromTransaction = (transaction) => {
  const { length, width, height } = transaction

  const measurement =
    length && width && height
      ? `${length}×${width}×${height}`
      : length && width
        ? `${length}×${width}`
        : undefined

  return {
    skuNo:         transaction.skuNo,
    shippingNo:    transaction.shippingNo,
    shape:         transaction.shape,
    weight:        transaction.weight,
    carat:         transaction.carat,
    cut:           transaction.cut,
    colour:        transaction.colour,
    clarity:       transaction.clarity,
    synthesis:     transaction.synthesis,
    measurement,
    certificateNo: transaction.certificateNo,
    laboratory:    transaction.laboratory,
  }
}

const buildPurchaseFromTransaction = (transaction, diamondId) => ({
  diamond:            diamondId,
  bank:               transaction.bank ?? undefined,
  supplier:           transaction.supplier,
  courier:            transaction.courier,
  buyerAtSource:      transaction.buyerAtSource,
  dateOfPurchase:     transaction.dateOfPurchase,
  pricePerCaratUSD:   transaction.pricePerCaratUSD,
  gstPercent:         transaction.gstPercent,
  gstAmount:          transaction.gstAmount,
  buyPriceTotal:      transaction.buyPriceTotal,
  purchaseCurrency:   transaction.purchaseCurrency,
  rateAtPurchase:     transaction.rateAtPurchase,
  basePriceINR:       transaction.basePriceINR,
  correctionPriceUSD: transaction.correctionPriceUSD,
  actualRate:         transaction.actualRate,
  actualPriceINR:     transaction.actualPriceINR,
  marketPL:           transaction.marketPL,
})

const buildSaleFromTransaction = (transaction, diamondId, purchaseId) => ({
  diamond:          diamondId,
  purchase:         purchaseId,
  bank:             transaction.bank ?? undefined,
  dateOfSale:       transaction.dateOfSale,
  buyerName:        transaction.buyerName,
  saleAmount:       transaction.saleAmount,
  saleCurrency:     transaction.saleCurrency,
  rateOnDateOfSale: transaction.rateOnDateOfSale,
  saleBaseINR:      transaction.saleBaseINR,
})

const buildPricingFromTransaction = (transaction, diamondId, purchaseId) => ({
  diamond:                diamondId,
  purchase:               purchaseId,
  bank:                   transaction.bank ?? undefined,
  markup:                 transaction.markup,
  sellPriceLocalCurrency: transaction.sellPriceLocalCurrency,
  localCurrency:          transaction.localCurrency,
  typeOfExchange:         transaction.typeOfExchange,
  priceRUB:               transaction.priceRUB,
  priceUSD:               transaction.priceUSD,
  pricePerCt:             transaction.pricePerCt,
  rateRUB:                transaction.rateRUB,
})

const buildPLFromTransaction = (transaction, diamondId, purchaseId, saleId) => ({
  diamond:              diamondId,
  purchase:             purchaseId,
  sale:                 saleId,
  marginality:          transaction.marginality,
  actualMarkup:         transaction.actualMarkup,
  manager:              transaction.manager,
  bonusPoints:          transaction.bonusPoints,
  bonusAmount:          transaction.bonusAmount,
  bonusRate:            transaction.bonusRate,
  bonusInLocalCurrency: transaction.bonusInLocalCurrency,
})

// ─────────────────────────────────────────────────────────────────────────────
// Create all linked documents (Diamond → Purchase → Sale + Pricing → PL)
// Returns { diamond, purchase, sale, pricing, pl } — all may be null on error
// ─────────────────────────────────────────────────────────────────────────────
const createLinkedDocuments = async (transaction) => {
  let diamond = null
  let purchase = null
  let sale = null
  let pricing = null
  let pl = null

  // 1. Diamond
  try {
    const diamondData = buildDiamondFromTransaction(transaction)
    diamond = new Diamond(diamondData)
    await diamond.save()
  } catch (err) {
    console.error('Diamond creation failed for SKU', transaction.skuNo, '—', err.message)
    return { diamond, purchase, sale, pricing, pl }
  }

  // 2. Purchase (requires diamond)
  try {
    const purchaseData = buildPurchaseFromTransaction(transaction, diamond._id)
    purchase = new Purchase(purchaseData)
    await purchase.save()
  } catch (err) {
    console.error('Purchase creation failed for SKU', transaction.skuNo, '—', err.message)
    return { diamond, purchase, sale, pricing, pl }
  }

  // 3. Sale (requires diamond + purchase)
  try {
    const saleData = buildSaleFromTransaction(transaction, diamond._id, purchase._id)
    sale = new Sale(saleData)
    await sale.save()
  } catch (err) {
    console.error('Sale creation failed for SKU', transaction.skuNo, '—', err.message)
  }

  // 4. Pricing (requires diamond + purchase; independent of sale)
  try {
    const pricingData = buildPricingFromTransaction(transaction, diamond._id, purchase._id)
    pricing = new Pricing(pricingData)
    await pricing.save()
  } catch (err) {
    console.error('Pricing creation failed for SKU', transaction.skuNo, '—', err.message)
  }

  // 5. PL (requires diamond + purchase + sale)
  if (sale) {
    try {
      const plData = buildPLFromTransaction(transaction, diamond._id, purchase._id, sale._id)
      pl = new PL(plData)
      await pl.save()
    } catch (err) {
      console.error('PL creation failed for SKU', transaction.skuNo, '—', err.message)
    }
  }

  return { diamond, purchase, sale, pricing, pl }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync all linked documents on update (upsert by diamond skuNo chain)
// ─────────────────────────────────────────────────────────────────────────────
const syncLinkedDocuments = async (transaction) => {
  // 1. Diamond
  let diamond = null
  try {
    const diamondData = buildDiamondFromTransaction(transaction)
    diamond = await Diamond.findOneAndUpdate(
      { skuNo: transaction.skuNo },
      diamondData,
      { returnDocument: 'after', runValidators: true }
    )
  } catch (err) {
    console.error('Diamond sync failed for SKU', transaction.skuNo, '—', err.message)
    return
  }

  if (!diamond) return

  // 2. Purchase
  let purchase = null
  try {
    const purchaseData = buildPurchaseFromTransaction(transaction, diamond._id)
    purchase = await Purchase.findOneAndUpdate(
      { diamond: diamond._id },
      purchaseData,
      { returnDocument: 'after', runValidators: true }
    )
  } catch (err) {
    console.error('Purchase sync failed for SKU', transaction.skuNo, '—', err.message)
    return
  }

  if (!purchase) return

  // 3. Sale
  let sale = null
  try {
    const saleData = buildSaleFromTransaction(transaction, diamond._id, purchase._id)
    sale = await Sale.findOneAndUpdate(
      { diamond: diamond._id },
      saleData,
      { returnDocument: 'after', runValidators: true }
    )
  } catch (err) {
    console.error('Sale sync failed for SKU', transaction.skuNo, '—', err.message)
  }

  // 4. Pricing
  try {
    const pricingData = buildPricingFromTransaction(transaction, diamond._id, purchase._id)
    await Pricing.findOneAndUpdate(
      { diamond: diamond._id },
      pricingData,
      { returnDocument: 'after', runValidators: true }
    )
  } catch (err) {
    console.error('Pricing sync failed for SKU', transaction.skuNo, '—', err.message)
  }

  // 5. PL
  if (sale) {
    try {
      const plData = buildPLFromTransaction(transaction, diamond._id, purchase._id, sale._id)
      await PL.findOneAndUpdate(
        { diamond: diamond._id },
        plData,
        { returnDocument: 'after', runValidators: true }
      )
    } catch (err) {
      console.error('PL sync failed for SKU', transaction.skuNo, '—', err.message)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete all linked documents on transaction delete
// ─────────────────────────────────────────────────────────────────────────────
const deleteLinkedDocuments = async (transaction) => {
  const diamond = await Diamond.findOne({ skuNo: transaction.skuNo })
  if (!diamond) {
    console.warn('deleteLinkedDocuments: no diamond found for skuNo:', transaction.skuNo)
    return
  }

  const diamondId = diamond._id

  const deletions = [
    ['PL',       () => PL.deleteMany({ diamond: diamondId })],
    ['Pricing',  () => Pricing.deleteMany({ diamond: diamondId })],
    ['Sale',     () => Sale.deleteMany({ diamond: diamondId })],
    ['Purchase', () => Purchase.deleteMany({ diamond: diamondId })],
    ['Diamond',  () => Diamond.findByIdAndDelete(diamondId)],
  ]

  for (const [name, fn] of deletions) {
    try {
      await fn()
    } catch (err) {
      console.error(`${name} delete failed for SKU ${transaction.skuNo}:`, err.message)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

export const createTransaction = async (req, res) => {
  try {
    const resolvedStatuses = await resolveStatuses(req.body.status, req.body.paymentStatus)
    const computedFields = await calculateTransactionFields(req.body)

    const transaction = new Transaction({
      ...req.body,
      ...resolvedStatuses,
      ...computedFields,
    })

    await transaction.save()

    // ── Create all linked documents ───────────────────────────────────────
    await createLinkedDocuments(transaction)
    // ─────────────────────────────────────────────────────────────────────

    const populated = await Transaction.findById(transaction._id)
      .populate('bank')
      .populate('status')
      .populate('paymentStatus')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    console.error('Create transaction error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('bank')
      .populate('status')
      .populate('paymentStatus')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: transactions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('bank')
      .populate('status')
      .populate('paymentStatus')
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' })
    res.status(200).json({ success: true, data: transaction })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateTransaction = async (req, res) => {
  try {
    const existing = await Transaction.findById(req.params.id)
    if (!existing) return res.status(404).json({ success: false, message: 'Transaction not found' })

    const mergedData = { ...existing.toObject(), ...req.body }

    const resolvedStatuses = await resolveStatuses(mergedData.status, mergedData.paymentStatus)
    const computedFields = await calculateTransactionFields(mergedData)

    const updateObject = { ...req.body, ...resolvedStatuses, ...computedFields }

    Object.keys(updateObject).forEach(k => {
      if (updateObject[k] === undefined) delete updateObject[k]
    })

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateObject,
      { returnDocument: 'after', runValidators: true }
    )
      .populate('bank')
      .populate('status')
      .populate('paymentStatus')

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' })

    // ── Sync all linked documents ─────────────────────────────────────────
    await syncLinkedDocuments(transaction)
    // ─────────────────────────────────────────────────────────────────────

    res.status(200).json({ success: true, data: transaction })
  } catch (error) {
    console.error('Update transaction error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

export const cleanupOrphanedDocuments = async (req, res) => {
  try {
    await PL.deleteMany({})
    await Pricing.deleteMany({})
    await Sale.deleteMany({})
    await Purchase.deleteMany({})
    await Diamond.deleteMany({})

    res.status(200).json({ success: true, message: 'All linked documents cleared' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id)
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' })

    // ── Delete all linked documents ───────────────────────────────────────
    try {
      await deleteLinkedDocuments(transaction)
    } catch (err) {
      console.error('Linked document delete failed for SKU', transaction.skuNo, '—', err.message)
    }
    // ─────────────────────────────────────────────────────────────────────

    res.status(200).json({ success: true, message: 'Transaction deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}