const jwt = require('jsonwebtoken')
const User = require('../model/user')

const isAuth = async (req, res, next) => {
    try {
        const token = req?.headers?.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JSON_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        
        req.token = token
        req.user = user
        next()
    } catch (e) {
        console.log("the error", e)
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = isAuth