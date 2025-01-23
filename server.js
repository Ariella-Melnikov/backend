import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

// Import routes and services
import { searchRouter } from './src/routes/search.routes.js' 
import { chatbotRouter } from './src/routes/chatbot.routes.js'
import { logger } from './src/services/logger.service.js' 

const app = express()
const server = http.createServer(app)

// Security middleware
app.use(helmet())
app.use(cookieParser())
app.use(express.json({ limit: '50mb', extended: true }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// CORS configuration
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('public')))
} else {
    const corsOptions = {
        origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }
    app.use(cors(corsOptions))
}

// Routes
app.use('/api/search', searchRouter)
app.use('/api/chatbot', chatbotRouter)

// Serve static files in production
app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server Error:', err)
    res.status(err.status || 500).send({ error: err.message || 'Internal Server Error' })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log('🚀 Server is running on port:', port)
    console.log('📝 OpenAI API Key status:', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Missing')
    console.log('🌐 Environment:', process.env.NODE_ENV)
    logger.info('Server is running on port: ' + port)
}).on('error', (err) => {
    logger.error('Failed to start server:', err)
    process.exit(1)
})