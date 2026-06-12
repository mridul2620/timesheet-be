const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(`[AUTH] Request to ${req.originalUrl}. Auth header present: ${!!authHeader}`);
    const token = authHeader && authHeader.split(' ')[1]; // Expecting: Bearer <token>

    if (!token) {
        console.log(`[AUTH] Rejected 401: No token`);
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required. Access denied.' 
        });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            // Distinguish expired token from invalid token for frontend refresh triggers
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access token expired', 
                    code: 'TOKEN_EXPIRED' 
                });
            }
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid access token', 
                code: 'INVALID_TOKEN' 
            });
        }
        req.user = user;
        next();
    });
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Insufficient permissions' 
            });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
