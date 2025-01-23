import { adminAuth } from '../config/firebase-admin.config.js'

export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        req.user = decodedToken
        next()
    } catch (error) {
        console.error('Authentication error:', error)
        res.status(401).json({ error: 'Invalid token' })
    }
}
