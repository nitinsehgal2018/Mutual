
'user strict';
const  connection  = require('../../db.js');


module.exports.insertData = async (tableName, body) => {    
    var conn = await connection.getConnection(); 
    const query = "INSERT into  "+tableName+"  (" + Object.keys(body).map(key => `${key}`).join(", ") + ") values ("+Object.keys(body).map(key => `?`).join(", ")+")";   
    const [rows] = await conn.execute(query,Object.values(body)); 
    conn.release() ; 
    return rows;
}

module.exports.updateData = async (tableName, portfolioId, inputData) => {
    Object.keys(inputData).forEach(function(key){
        if (inputData[key] === "") {
          delete inputData[key];
        }
    });
    var conn = await connection.getConnection(); 
    const query = "UPDATE "+tableName+" SET " + Object.keys(inputData).map(key => `${key} = ?`).join(", ") + " WHERE id = ?";    
    const parameters = [...Object.values(inputData), portfolioId];   
    const [rows] = await conn.execute(query, parameters); 
    conn.release() ; 
    return rows;
}

module.exports.updatePartnerData = async (tableName, portfolioId, inputData) => {
    Object.keys(inputData).forEach(function(key){
        if (inputData[key] === "") {
          delete inputData[key];
        }
    });
    var conn = await connection.getConnection(); 
    const query = "UPDATE "+tableName+" SET " + Object.keys(inputData).map(key => `${key} = ?`).join(", ") + " WHERE partnerId = ?";    
    const parameters = [...Object.values(inputData), portfolioId];   
    const [rows] = await conn.execute(query, parameters); 
    conn.release() ; 
    return rows;
}

module.exports.getUserByUid = async (userId) => {
    var conn = await connection.getConnection(); 
    const [rows] = await connection.execute('SELECT *  FROM `users` WHERE `id` = ?', [userId]);
    delete rows[0].password
    conn.release() ; 
    return rows;
}


module.exports.getAdminByUid = async (userId) => {
    var conn = await connection.getConnection(); 
    const [rows] = await conn.execute('SELECT *  FROM `users` WHERE `id` = ?', [userId]);
    delete rows[0].password
    conn.release() ; 
    return rows;
}
