const jwt = require('jsonwebtoken')

// verify token
function verifyToken(req, res, next) {
    const authToken = req.headers.authorization
    if (authToken) {
        const token = authToken.split(" ")[1]
        try {
            const decodedPayload = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decodedPayload
            console.log(decodedPayload)
            next()
        } catch (err) {
            return res.status(401).json({ message: "Invalid Token!" })
        }
    } else {
        return res.status(401).json({ message: "No Token Provided!" })
    }
}

// verify token & admin
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next()
        } else {
            return res.status(403).json({ message: "Allow for Admins Only" })
        }
    })
}

// verify token & auth
function verifyTokenAndOnlyUser(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id) {
            next()
        } else {
            return res.status(403).json({ message: "Allow for User himself Only" })
        }
    })
}

// verify token and admin or user himself
function verifyTokenAndAdminOrUser(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next()
        } else {
            return res.status(403).json({ message: "Allow for User himself Or Admins Only" })
        }
    })
}

module.exports = {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndOnlyUser,
    verifyTokenAndAdminOrUser
}