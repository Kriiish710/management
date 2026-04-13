import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'

// Models
import './models/Diamond.js'
import './models/Bank.js'
import './models/Purchase.js'
import './models/Pricing.js'
import './models/Inventory.js'
import './models/Sale.js'
import './models/PL.js'
import './models/Contact.js'
import './models/Transaction.js'
import './models/Status.js'
import './models/PaymentStatus.js'

// Routes
import diamondRoutes from './routes/diamondRoutes.js'
import bankRoutes from './routes/bankRoutes.js'
import purchaseRoutes from './routes/purchaseRoutes.js'
import pricingRoutes from './routes/pricingRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import saleRoutes from './routes/saleRoutes.js'
import plRoutes from './routes/plRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import statusRoutes from './routes/statusRoutes.js'
import paymentStatusRoutes from './routes/paymentStatusRoutes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Register routes
app.use('/api/diamonds', diamondRoutes)
app.use('/api/banks', bankRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/pl', plRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/statuses', statusRoutes)
app.use('/api/payment-statuses', paymentStatusRoutes)
app.use('/api/transactions', transactionRoutes)


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch((err) => console.log('Connection error:', err))

app.listen(process.env.PORT, () => {
  console.log(`🛜  Server running on port ${process.env.PORT}`)
})