const jwt = require('jsonwebtoken');
const  connection  = require('../../db.js');

async function checkAuth  (req,res,next) {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_KEY);
        console.log(decodedToken)

        var conn = await connection.getConnection();  
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[decodedToken.user_id,'Normal']);      
        if (rows.length == 0) {      
            res.status(401).send({
                "error" : 1,
                "message" : "Invalid Token!! User does not exists"
            });
        }    

        if(decodedToken.user_type != "Normal") {     
            res.status(401).send({
                "error" : 1,
                "message" : "Invalid Token!! You are not Manager!"
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
    req.userId = decodedToken.user_id;
    req.userType = decodedToken.user_type;
    next();   
} 
module.exports = checkAuth ;