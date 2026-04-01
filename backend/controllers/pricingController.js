import Pricing from '../models/Pricing.js'
import Purchase from '../models/Purchase.js'
import Bank from '../models/Bank.js'

// Create pricing for a diamond
export const createPricing = async (req, res) => {
  try {
    const { purchaseId, bankId, markup } = req.body

    // Pull purchase to get actual INR price
    const purchase = await Purchase.findById(purchaseId).populate('bank')
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })

    // Get rates from bank if selected
    let rateRUB = req.body.rateRUB
    if (bankId) {
      const bank = await Bank.findById(bankId)
      if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
      rateRUB = bank.usdToRub
    }

    // Auto calculate sell prices
    const actualPriceINR = purchase.actualPriceINR
    const marketPL = purchase.marketPL
    const priceUSD = purchase.buyPriceTotal * (1 + markup / 100)
    const priceRUB = priceUSD * rateRUB
    const pricePerCt = priceUSD / purchase.diamond?.weight || 0
    const sellPriceLocalCurrency = req.body.localCurrency === 'RUB' ? priceRUB : priceUSD

    const pricing = new Pricing({
      ...req.body,
      diamond: purchase.diamond,
      purchase: purchaseId,
      bank: bankId || null,
      rateRUB,
      priceUSD,
      priceRUB,
      pricePerCt,
      sellPriceLocalCurrency,
    })

    await pricing.save()
    res.status(201).json({ success: true, data: pricing })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Get all pricing records
export const getAllPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find()
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    res.status(200).json({ success: true, data: pricing })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single pricing record
export const getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id)
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' })
    res.status(200).json({ success: true, data: pricing })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update pricing
export const updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' })
    res.status(200).json({ success: true, data: pricing })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete pricing
export const deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id)
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' })
    res.status(200).json({ success: true, message: 'Pricing deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}