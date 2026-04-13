import Transaction from '../models/Transaction.js'
import Bank from '../models/Bank.js'
import Status from '../models/Status.js'
import PaymentStatus from '../models/PaymentStatus.js'
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

// ─────────────────────────────────────────────────────────────────────────────
// calculateTransactionFields
//
// All formulas verified against Excel (Stock2upd.xlsx):
//
//  gstAmount            = weight × pricePerCaratUSD × (gstPercent / 100)
//  buyPriceTotal        = weight × pricePerCaratUSD + gstAmount
//  basePriceINR         = buyPriceTotal × rateAtPurchase          (bank.usdToInr)
//  actualPriceINR       = correctionPriceUSD × weight × actualRate
//  marketPL             = actualPriceINR − basePriceINR
//  sellPriceLocalCurrency = actualPriceINR / bank.inrToRub × (1 + markup)
//  priceRUB             = ROUNDUP(sellPriceLocalCurrency, −2)     (ceil to nearest 100)
//  priceUSD             = priceRUB / bank.inrToRub                ← FIX: was ÷ usdToRub
//  pricePerCt           = priceUSD / weight
//  saleBaseINR          = saleAmount × rateOnDateOfSale           ← FIX: direct multiply, not currency switch
//  marginality          = saleBaseINR − basePriceINR
//  actualMarkup         = saleBaseINR / (basePriceINR / 100) − 100
//  bonusAmount          = actualPriceINR × bonusPoints / 100
//  bonusInLocalCurrency = bonusAmount / bonusRate                 ← FIX: was × bonusRate
// ─────────────────────────────────────────────────────────────────────────────
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

  // These three come from the bank record
  let rateAtPurchase = safeNum(data.rateAtPurchase)   // bank.usdToInr  e.g. 94.2
  let rateRUB = safeNum(data.rateRUB)          // bank.usdToRub  e.g. 1.173
  let bonusRate = safeNum(data.bonusRate)        // bank.inrToRub  e.g. 81.5
  let resolvedBankId = null

  // ── Bank resolution ───────────────────────────────────────────────────────
  // Priority 1: explicit bank ObjectId from edit modal dropdown
  const bankId = data.bank || data.typeOfExchange
  if (bankId && mongoose.Types.ObjectId.isValid(bankId)) {
    const bank = await Bank.findById(bankId)
    if (bank) {
      rateAtPurchase = bank.usdToInr
      rateRUB = bank.usdToRub
      bonusRate = bank.inrToRub
      resolvedBankId = bank._id
    }
  }
  // Priority 2: match bank by name string from Excel import
  else if (typeOfExchange && typeof typeOfExchange === 'string') {
    const bank = await findBankByName(typeOfExchange)
    if (bank) {
      rateAtPurchase = bank.usdToInr
      rateRUB = bank.usdToRub
      bonusRate = bank.inrToRub
      resolvedBankId = bank._id
    }
  }

  // ── Raw inputs ────────────────────────────────────────────────────────────
  const _weight = safeNum(weight)
  const _pricePct = safeNum(pricePerCaratUSD)
  const _gstPct = safeNum(gstPercent) ?? 0
  const _markup = safeNum(markup)
  const _bonusPts = safeNum(bonusPoints) ?? 0
  const _saleAmount = safeNum(saleAmount)

  const correctionPriceUSD = safeNum(data.correctionPriceUSD) ?? _pricePct
  const actualRate = safeNum(data.actualRate) ?? rateAtPurchase
  const rateOnDateOfSale = safeNum(data.rateOnDateOfSale)

  // ── Purchase calculations ─────────────────────────────────────────────────
  // gstAmount = weight × pricePerCaratUSD × (gstPercent / 100)
  const gstAmount = (_weight != null && _pricePct != null)
    ? _weight * _pricePct * (_gstPct / 100)
    : undefined

  // buyPriceTotal = weight × pricePerCaratUSD + gstAmount
  const buyPriceTotal = (_weight != null && _pricePct != null)
    ? _weight * _pricePct + (gstAmount ?? 0)
    : undefined

  // basePriceINR = buyPriceTotal × rateAtPurchase
  const basePriceINR = (buyPriceTotal != null && rateAtPurchase != null)
    ? buyPriceTotal * rateAtPurchase
    : undefined

  // actualPriceINR = correctionPriceUSD × weight × actualRate
  const actualPriceINR = (correctionPriceUSD != null && _weight != null && actualRate != null)
    ? correctionPriceUSD * _weight * actualRate
    : undefined

  // marketPL = actualPriceINR − basePriceINR
  const marketPL = (actualPriceINR != null && basePriceINR != null)
    ? actualPriceINR - basePriceINR
    : undefined

  // ── Pricing calculations ──────────────────────────────────────────────────
  // sellPriceLocalCurrency = actualPriceINR / bank.usdToRub × (1 + markup)
  const sellPriceLocalCurrency = (actualPriceINR != null && bonusRate != null && _markup != null)
    ? (actualPriceINR / bonusRate) * (1 + _markup)
    : undefined

  // pricePerCt = sellpriceLocalCurrency * bank.intToRub    
  const priceRUB = (sellPriceLocalCurrency != null && bonusRate != null)
    ? Math.ceil((sellPriceLocalCurrency * bonusRate) / 100) * 100
    : undefined

  // pricePerCt = sellpriceLocalCurrency * bank.intToUsd  
  const priceUSD = (sellPriceLocalCurrency != null && rateAtPurchase != null)
    ? sellPriceLocalCurrency / rateAtPurchase
    : undefined

  // pricePerCt = priceUSD / weight
  const pricePerCt = (priceUSD != null && _weight != null)
    ? priceUSD / _weight
    : undefined

  // ── Sale calculations ─────────────────────────────────────────────────────
  // saleBaseINR = saleAmount × rateOnDateOfSale  (direct, no currency switch)
  const saleBaseINR = (_saleAmount != null && rateOnDateOfSale != null)
    ? _saleAmount * rateOnDateOfSale
    : undefined

  // marginality = saleBaseINR − basePriceINR
  const marginality = (saleBaseINR != null && basePriceINR != null)
    ? saleBaseINR - basePriceINR
    : undefined

  // actualMarkup = saleBaseINR / (basePriceINR / 100) − 100
  const actualMarkup = (saleBaseINR != null && basePriceINR != null && basePriceINR !== 0)
    ? saleBaseINR / (basePriceINR / 100) - 100
    : undefined

  // ── Bonus calculations ────────────────────────────────────────────────────
  // bonusAmount = actualPriceINR × bonusPoints / 100
  const bonusAmount = (actualPriceINR != null)
    ? (actualPriceINR * _bonusPts) / 100
    : undefined

  // bonusInLocalCurrency = bonusAmount / bonusRate   ← divide, not multiply
  const bonusInLocalCurrency = (bonusAmount != null && bonusRate != null)
    ? bonusAmount / bonusRate
    : undefined

  // ── Strip undefined / NaN ─────────────────────────────────────────────────
  const computed = {
    rateAtPurchase,
    rateRUB,
    bonusRate,
    gstAmount,
    buyPriceTotal,
    basePriceINR,
    correctionPriceUSD,
    actualRate,
    actualPriceINR,
    marketPL,
    sellPriceLocalCurrency,
    priceRUB,
    priceUSD,
    pricePerCt,
    rateOnDateOfSale,
    saleBaseINR,
    marginality,
    actualMarkup,
    bonusAmount,
    bonusInLocalCurrency,
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

    // Merge existing → incoming so calculateTransactionFields has full context
    const mergedData = {
      ...existing.toObject(),
      ...req.body,
    }

    const resolvedStatuses = await resolveStatuses(mergedData.status, mergedData.paymentStatus)
    const computedFields = await calculateTransactionFields(mergedData)

    const updateObject = {
      ...req.body,
      ...resolvedStatuses,
      ...computedFields,
    }

    Object.keys(updateObject).forEach(k => {
      if (updateObject[k] === undefined) delete updateObject[k]
    })

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateObject,
      { new: true, runValidators: true }
    )
      .populate('bank')
      .populate('status')
      .populate('paymentStatus')

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' })

    res.status(200).json({ success: true, data: transaction })
  } catch (error) {
    console.error('Update transaction error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id)
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' })
    res.status(200).json({ success: true, message: 'Transaction deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}