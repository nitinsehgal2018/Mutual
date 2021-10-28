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
        if(decodedToken.user_type != "Normal") {
            res.status(401).send({
                "error" : 1,
                "message" : "Invalid Token!! You are not authorized user"
            });
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
    console.log(decodedToken)
    req.body.userId   = decodedToken.user_id;
    req.body.brokered = decodedToken.brokered  == 'Yes' ? 1 : 0;
    req.body.payroll  = decodedToken.payroll   == 'Yes' ? 1 : 0;
    next();   
} 
module.exports = checkAuth ;