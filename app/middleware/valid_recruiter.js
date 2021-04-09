const jwt = require('jsonwebtoken');

function checkAuth (req,res,next) {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.RECRUITER_KEY);
        if(!decodedToken) {
            if(decodedToken.user_type != "Admin") {
                res.status(401).send({
                    "error" : 1,
                    "message" : "Invalid Token!! "
                });
            }
        }
    } catch (err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        throw error;
    }
    req.body.userId = decodedToken.user_id;
    next();   
} 
module.exports = checkAuth ;