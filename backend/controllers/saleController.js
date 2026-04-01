import Sale from '../models/Sale.js'
import Purchase from '../models/Purchase.js'
import Bank from '../models/Bank.js'

export const createSale = async (req, res) => {
  try {
    const { purchase: purchaseId, bank: bankId, saleAmount, saleCurrency } = req.body

    const purchase = await Purchase.findById(purchaseId)
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' })

    let rateOnDateOfSale = req.body.rateOnDateOfSale
    if (bankId) {
      const bank = await Bank.findById(bankId)
      if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' })
      rateOnDateOfSale = saleCurrency === 'RUB' ? bank.usdToRub : bank.usdToInr
    }

    let saleBaseINR = 0
    if (saleCurrency === 'RUB') {
      const bank = await Bank.findById(bankId)
      saleBaseINR = (saleAmount / rateOnDateOfSale) * bank.usdToInr
    } else if (saleCurrency === 'USD') {
      saleBaseINR = saleAmount * rateOnDateOfSale
    } else {
      saleBaseINR = saleAmount
    }

    const sale = new Sale({
      ...req.body,
      diamond: purchase.diamond,
      purchase: purchaseId,
      bank: bankId || null,
      rateOnDateOfSale,
      saleBaseINR,
    })

    await sale.save()
    res.status(201).json({ success: true, data: sale })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    res.status(200).json({ success: true, data: sales })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' })
    res.status(200).json({ success: true, data: sale })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('diamond')
      .populate('purchase')
      .populate('bank')
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' })
    res.status(200).json({ success: true, data: sale })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id)
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' })
    res.status(200).json({ success: true, message: 'Sale deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}