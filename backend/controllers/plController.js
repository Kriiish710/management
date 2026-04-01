import PL from '../models/PL.js'
import Sale from '../models/Sale.js'
import Purchase from '../models/Purchase.js'
import Bank from '../models/Bank.js'

export const createPL = async (req, res) => {
  try {
    const { sale: saleId, bonusPoints } = req.body

    // Pull sale details
    const sale = await Sale.findById(saleId).populate('purchase').populate('bank')
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' })

    // Pull purchase details
    const purchase = await Purchase.findById(sale.purchase._id)
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })
      
    // Auto calculate P&L only if not provided in body
    const marginality = req.body.marginality ?? (sale.saleBaseINR - purchase.actualPriceINR)
    const actualMarkup = req.body.actualMarkup ?? (((sale.saleBaseINR - purchase.actualPriceINR) / purchase.actualPriceINR) * 100)

    // Auto calculate bonus only if not provided in body
    const bonusAmount = req.body.bonusAmount ?? ((sale.saleBaseINR * (bonusPoints || 0)) / 100)

    // Convert bonus to local currency using bank rate
    let bonusRate = req.body.bonusRate
    let bonusInLocalCurrency = bonusAmount
    if (sale.bank) {
      const bank = await Bank.findById(sale.bank)
      if (bank) {
        bonusRate = bank.inrToRub
        bonusInLocalCurrency = bonusAmount * bonusRate
      }
    }

    const pl = new PL({
      diamond: sale.diamond,
      purchase: sale.purchase._id,
      sale: saleId,
      marginality,
      actualMarkup,
      manager: req.body.manager,
      bonusPoints: bonusPoints || 0,
      bonusAmount,
      bonusRate,
      bonusInLocalCurrency,
    })

    await pl.save()
    res.status(201).json({ success: true, data: pl })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllPL = async (req, res) => {
  try {
    const pl = await PL.find()
      .populate('diamond')
      .populate('purchase')
      .populate('sale')
    res.status(200).json({ success: true, data: pl })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getPL = async (req, res) => {
  try {
    const pl = await PL.findById(req.params.id)
      .populate('diamond')
      .populate('purchase')
      .populate('sale')
    if (!pl) return res.status(404).json({ success: false, message: 'PL record not found' })
    res.status(200).json({ success: true, data: pl })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getPLByManager = async (req, res) => {
  try {
    const pl = await PL.find({ manager: req.params.manager })
      .populate('diamond')
      .populate('purchase')
      .populate('sale')
    res.status(200).json({ success: true, data: pl })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updatePL = async (req, res) => {
  try {
    const pl = await PL.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('diamond')
      .populate('purchase')
      .populate('sale')
    if (!pl) return res.status(404).json({ success: false, message: 'PL record not found' })
    res.status(200).json({ success: true, data: pl })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deletePL = async (req, res) => {
  try {
    const pl = await PL.findByIdAndDelete(req.params.id)
    if (!pl) return res.status(404).json({ success: false, message: 'PL record not found' })
    res.status(200).json({ success: true, message: 'PL record deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}