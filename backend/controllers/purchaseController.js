import Purchase from '../models/Purchase.js'
import Diamond from '../models/Diamond.js'
import Bank from '../models/Bank.js'

export const createPurchase = async (req, res) => {
  try {
    const { bankId, pricePerCaratUSD, gstPercent } = req.body

    // Fetch diamond to get weight automatically
    const diamond = await Diamond.findById(req.body.diamond)
    if (!diamond) return res.status(404).json({ success: false, message: 'Diamond not found' })

    // Get bank rates
    let rateAtPurchase = req.body.rateAtPurchase
    if (req.body.bank) {
      const bank = await Bank.findById(req.body.bank)
      if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
      rateAtPurchase = bank.usdToInr
    }

    // Auto calculate using diamond weight
    const buyPriceTotal = pricePerCaratUSD * diamond.weight
    const gstAmount = (buyPriceTotal * (gstPercent || 0)) / 100
    const basePriceINR = buyPriceTotal * rateAtPurchase
    const correctionPriceUSD = req.body.correctionPriceUSD || pricePerCaratUSD
    const actualRate = req.body.actualRate || rateAtPurchase
    const actualPriceINR = (correctionPriceUSD * diamond.weight) * actualRate
    const marketPL = basePriceINR - actualPriceINR

    const purchase = new Purchase({
      ...req.body,
      bank: bankId || null,
      rateAtPurchase,
      buyPriceTotal,
      gstAmount,
      basePriceINR,
      correctionPriceUSD,
      actualRate,
      actualPriceINR,
      marketPL,
    })

    await purchase.save()
    res.status(201).json({ success: true, data: purchase })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('diamond')
      .populate('bank')
    res.status(200).json({ success: true, data: purchases })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('diamond')
      .populate('bank')
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })
    res.status(200).json({ success: true, data: purchase })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('diamond')
      .populate('bank')
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })
    res.status(200).json({ success: true, data: purchase })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id)
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })
    res.status(200).json({ success: true, message: 'Purchase deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}