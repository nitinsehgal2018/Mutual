'user strict';
const  connection  = require('../../../db.js');
const commonModel = require('../commonModel')
const  template =  require('../../emailTemplate/forgotTemplate')
const bcrypt = require('bcryptjs');

var _ = require('underscore');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mail = require('../../middleware/mail.js');
const readXlsxFile = require("read-excel-file/node");
const path = require('path');     
const { exit, resourceUsage } = require('process');
const async = require('async');
const { isBoolean } = require('underscore');
const  ERROR_MSG =   require('../../middleware/message.json')
const  signupTemplate =  require('../../emailTemplate/signupTemplate')
const AWS = require("aws-sdk");
AWS.config.update({
    "accessKeyId": process.env.S3_ACCESS_KEY,
    "secretAccessKey": process.env.S3_SECRET_KEY,
    "region": 'us-east-2'
});
var s3 = new AWS.S3();

/** **********************************************************************
 *                  List of User login Function
 **************************************************************************/
module.exports.login = async (email, password) => {   
    try {        
        var conn = await connection.getConnection();     
        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ?',[email]);       
        if (rows.length > 0) {            
            
            if(rows[0].siteAccess == 0){
                conn.release();
                return {
                    message: "Your account is not authorized to access liberty mutual.",
                    loggedin: 0
                };
            }
            
            if(rows[0].invitationExpire != '' && rows[0].invitationExpire <= Date.now() ){
                conn.release();
                return {    
                    message:'Account has been expired. Please contact liberty mututal admin'  ,
                    loggedin: 0           
                };
            }
      
            
            if(rows[0].isDeleted == 1){
                conn.release();
                return {
                    message: "Your account not longer exists with liberty mutual.",
                    loggedin: 0
                };
            }
            if(rows[0].isBlocked == 1){
                conn.release();
                return {
                    message: "Your account has beed blocked.",
                    loggedin: 0
                };
            }
            const isEqual = await bcrypt.compare(password, rows[0].password);
            // const isEqual = true
            if (!isEqual) {
                conn.release();
                return {
                    message: "Incorrect email address or Password.",
                    loggedin: 0
                };
            }
            else {
                if(rows[0].invitationExpire != ''){
                    // console.log("enter updateda")
                    await conn.execute('UPDATE users SET invitationExpire = ?, invitation = ? WHERE id = ?',['',1,rows[0].id]);               
                }
               
                //genrate json web token
                const token = jwt.sign({
                    email: email,
                    user_id: rows[0].id,
                    user_type :rows[0].role,
                    brokered :rows[0].brokered,
                    payroll :rows[0].payroll,
                }, process.env.JWT_KEY, {
                    expiresIn: "10d"
                });
                conn.release();
               
                rows[0].token = token 
                delete rows[0].password              
                return {  
                    message:'success',  
                    data:rows[0],     
                    status:1,
                    loggedin: 1
                };
            }
        } else {
            conn.release();
            return {
                message: "Incorrect email address or Password.",
                loggedin: 0
            };
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.signup = async (body) => {   
    try {
        var conn = await connection.getConnection();     
        let payloadData = { 
            email :body.email, firstName:body.firstName, 
            lastName:body.lastName, role:body.role, phone:body.phone 
        }
       
        // const password = 'qwerty'
        const password = generatePassword();
        const hashPassword = await bcrypt.hash(password, 12);

        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ? ',[body.email]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email already  exists.",
                    loggedin: 0
                };
        } else {
    
            const [rows]  = await conn.execute(`INSERT INTO users (email,firstName,lastName,role,phone,password) VALUES(?,?,?,?,?,?)`,
            [payloadData.email,payloadData.firstName,payloadData.lastName, payloadData.role,payloadData.phone,hashPassword]) ;
            
            const lastInsertId = rows.insertId;     
                    
            const subject = "Liberty Mutual - SignUp";
            const from = 'Liberty Mutual Admin<lmpartnerportal@libertymutualinsurance.awsapps.com>';
            const to = payloadData.email;

            const message = `<table cellpadding="0" cellspacing="0" style="font-family:'Labtop',sans-serif;font-size:14px;border-radius:3px;background:#fff;margin:0;padding:0;border:1px solid #e9e9e9;margin:0 auto;max-width:700px" width="100%">
            <div style="padding-left:300px;">
            <img src="" style="width:120px;margin-top:20px;">
            </div>
            <tbody>
                <tr style="font-family:'Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:14px;margin:0;padding:0;background:white">
                    <td colspan="3" style="font-family:'Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:14px;vertical-align:top;margin:0;padding:20px;border-top:10px solid #ffffff" valign="top">
                    <table cellpadding="0" cellspacing="0" style="font-family:'Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:14px;margin:0;padding:0" width="100%">
                        <tbody>
                            <tr>
                                <td width="15%"></td>
                                <td style="font-weight:300;vertical-align:top;padding-bottom:25px;color:dimgray;width:70%;padding:10px;text-align:left" valign="top">
                                <p style="font-size:16px">Hello ${payloadData.firstName} ${payloadData.lastName},</p>
                                <p style="font-size:16px">
                                        Your account has been added.
                                        <br/> Your password is ${password} 
                                    </p>
                                <p style="font-size:16px">Warm Regards,<br>Liberty Mutual</p>
                                </td>
                                <td width="15%"></td>
                            </tr>
                        </tbody>
                    </table>
                    </td>
                </tr>
            </tbody>
            </table>`;
            
            mail.mailfunction(from, to, subject, message);
            const token = jwt.sign({
                email: payloadData.email,
                user_id: lastInsertId,
               
            }, process.env.JWT_KEY, {
                expiresIn: "2d"
            });
            conn.release();
            return {              
                token: token,
                userId: lastInsertId,
                firstName: payloadData.firstName,
                lastName: payloadData.lastName ,
                role : payloadData.role,
                loggedin: 1             
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



/** **********************************************************************
 *                  List of Change password  Related Function
 **************************************************************************/
module.exports.resetPassword = async (req) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT id FROM users WHERE id = ? ',[req.userId]); 
        if(rows[0].length == 0 ){
            conn.release();
            return {    
                message:'User does not exists'  ,
                status: 0           
            };
        }
        if(rows[0].firstTimeLogin == 1 ){
            conn.release();
            return {    
                message:'User already reset password at first time'  ,
                status: 0           
            };
        }
        const password = await bcrypt.hash(req.new_pass, 12);            
        await conn.execute('UPDATE users SET password = ?, firstTimeLogin = ? WHERE id = ?',[ password, 1, req.userId]);
        conn.release(); 
        return {    
            message:'Password reset successfully.'  ,
            status:1                  
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.changePassword = async (req) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT * FROM users WHERE id = ? ',[req.userId]); 
        const isEqual = await bcrypt.compare(req.current_pass, rows[0].password);
        if (!isEqual) {
            conn.release();
            return {
                message: "The old password you have entered is incorrect.",
                statusCode: 500
            };
        } else {
            const password = await bcrypt.hash(req.new_pass, 12);            
            var result =  await conn.execute('UPDATE users SET password = ? WHERE id = ?',[password, req.userId]);
            conn.release(); 
            return {    
                message:'Password updated successfully.'  ,
                status:1                  
            };
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.forgotPassword = async (email) => {
    const subject = "Liberty Mutual - Forgot Password!";
    const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
    const to = email;
    var conn = await connection.getConnection();
    const [rows] =  await conn.execute('SELECT id, firstName FROM users WHERE email = ? AND isDeleted = 0  AND role = ? ',[email,"Normal"]); 
  
    if (rows.length == 0) {
        conn.release()
        return {
            message: "Email does not exists.",
            status:0
        };
    }
    const password = generatePassword();
    let resetToken = generateRandomString(50);
    let resetTokenExpire = Date.now() + 3600000;
    const hashPassword = await bcrypt.hash(password, 12);
    const first_name = rows[0].firstName;
    const userId = rows[0].id;
   
    var rs = await conn.execute('UPDATE users SET resetPasswordToken = ? , resetPasswordExpire = ? WHERE id = ?',[resetToken,resetTokenExpire,userId]);
    conn.release();
    let payloadData = {}
    payloadData.password = password
    payloadData.first_name = first_name    
    payloadData.logo = BaseURL+'/liberty_logo_second.png'    
    // create url form reset password
   
    const url = `https://www.lmpartnerportal.com/reset/${resetToken}`;
    payloadData.url = url;
    const message = await template.forgotTemplate(payloadData)
    const mailResponse = mail.mailfunction(from, to, subject, message)
    return {    
        message:'success',
        status:1                  
    };
}

module.exports.resetForgotPassword = async (req) => {
    try {
       
        var conn = await connection.getConnection();   
        let time_now = Date.now() ; 
        var [rows] =  await conn.execute('SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire >= ?',[req.resetPasswordToken,time_now]); 
        if(rows.length == 0){
            conn.release(); 
            return {    
                message:'Password reset token is invalid or has expired.'  ,
                status:0              
            };
        }
      
        const password = await bcrypt.hash(req.new_pass, 12);            
        await conn.execute('UPDATE users SET password = ? , resetPasswordToken = ? , resetPasswordExpire = ?  WHERE id = ?',[password,'','',rows[0].id]);      
        conn.release(); 
        return {    
            message:'Password reset successfully.'  ,
            status:1                  
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



/** **********************************************************************
 *                  List of User profile  Related Function
**************************************************************************/
module.exports.updateProfile = async (req) => {
    try {
        var conn = await connection.getConnection();  
        
        let userId = req.userId
        delete req.userId;     

        const result = await commonModel.updateData('users',userId, req);
        // await conn.execute('UPDATE users SET firstName = ?, lastName = ?, url = ? WHERE id = ?',[ req.firstName,req.lastName, req.url, u_id]);
        const rows = await commonModel.getUserByUid(userId);      
        conn.release(); 
        return {    
            message:'Profile updated successfully.'  ,
            status:1,
            data:rows             
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getProfile = async (req) => {   
    try {         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT id,firstName,lastName,email,brokered,payroll,isBlocked,isDeleted FROM users WHERE id = ?',[req.userId]); 
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No users exists.",
                    status:0
                };
        } else {

            var newUserInfo = [];
        
            for (let i = 0; i < rows.length; i++) {                 
                const [result]  =  await conn.execute('SELECT * FROM user_urls WHERE userId = ? AND siteAccess = ?',[rows[i].id,1]);                
                newUserInfo = rows
                newUserInfo[i].url = result              
                // console.log(newBookInfo);
            }
         
            conn.release();
            return {              
                status: 1,
                message:"success",
                data:newUserInfo         
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

/** **********************************************************************
 *                  List of New Products Related Function
 **************************************************************************/
module.exports.getParentCategory = async (body) => {   
    try {
        
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute(`SELECT id FROM categories WHERE parent_id = ?`,[0]);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Parent Category exists.",
                    status:0
                };
        } else {  

            const [rows1]  = await conn.execute(`SELECT c1.id, c1.name as parent_name,c1.description as parentDescription , c2.description as subCatDescription, c2.id, c2.name , c2.type as CategoryType FROM categories c1 LEFT JOIN categories c2 ON c2.parent_id = c1.id 
            WHERE c1.parent_id = ? AND c1.isDeleted = ? AND  c2.isDeleted = ? AND c1.isBlocked = ? AND  c2.isBlocked = ?  ORDER BY c1.position`,[0,0,0,0,0]);           
            if (rows1.length > 0) { 
               
                
                const isBrokered =  body.brokered
                const isPayroll  =  body.payroll

                for (let i = 0; i < rows1.length; i++) {   
                   
                    var categoryId = rows1[i].id;
                    if(rows1[i].CategoryType == 3){  // for products
                        // console.log("CategoryType first "+rows1[i].CategoryType)
                        // console.log("ID first "+rows1[i].id) 

                        const [productsResult]  =  await conn.execute(`SELECT products.id,products.pdf_path,products.title,products.description,
                        categories.name as categoryName FROM products INNER JOIN categories ON products.categoryId = categories.id  
                        WHERE categories.isDeleted = ? AND categories.isBlocked = ? AND products.isBlocked = ? 
                        AND products.isDeleted = ? AND products.categoryId = ${categoryId}
                        AND products.isBrokered = ${isBrokered} ORDER BY products.createdDate`,[0,0,0,0]);
                       
                        if(productsResult.length == 0){
                            // console.log("=== np record first ===")
                            delete rows1[i];
                        }                      
                  
                    } else if(rows1[i].CategoryType == 2){ // for auto programs
                        // console.log("CategoryType second "+rows1[i].CategoryType)
                        // console.log("ID second "+rows1[i].id)
                       
                        const [productsResult]  = await conn.execute(`SELECT 
                        programs.id, programs.path, programs.thumbnail, programs.description,  programs.title, programs.type,categories.id as categoryId, categories.name as categoryName, categories.description as categoryDescription
                        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
                        WHERE categories.isBlocked = ? AND categories.isDeleted = ?  AND programs.isBlocked = ? AND programs.isDeleted = ? 
                        AND (programs.isBrokered = ${isBrokered} AND programs.isPayroll = ${isPayroll} AND programs.categoryId = ${categoryId})
                        OR  (programs.isBrokered = 2  AND programs.isPayroll = 2 AND programs.categoryId = ${categoryId}) 
                        OR  (programs.isBrokered = ${isBrokered}   AND programs.isPayroll = 2 AND programs.categoryId = ${categoryId})             
                        ORDER BY programs.createdDate`,
                        [0,0,0,0]);  
                      
                        if(productsResult.length == 0){
                            // console.log("=== np record second ===")
                            delete rows1[i];
                        }                      
                  
                    }  else if(rows1[i].CategoryType == 0){ // for content videos
                        // console.log("CategoryType third "+rows1[i].CategoryType)
                        // console.log("ID third "+rows1[i].id)

                        const [productsResult]  = await conn.execute(`SELECT videos.id,videos.thumbnail,videos.videoPath,
                        videos.title,videos.description,categories.id as categoryId,categories.name as categoryName FROM videos
                         INNER JOIN categories ON videos.categoryId = categories.id  
                        WHERE categories.isBlocked = ? AND videos.isBlocked = ? AND videos.isDeleted = ? 
                        AND videos.categoryId = ${categoryId} ORDER BY videos.createdDate`,
                        [0,0,0]);  
                       
                        if(productsResult.length == 0){
                            // console.log("=== np record third ===")
                            delete rows1[i];
                        }                      
                  
                    }  
                }

                
                var group_to_values = rows1.reduce(function (obj, item) {
                    obj[item.parent_name] = obj[item.parent_name] || [];
                    obj[item.parent_name].push(item);
                    return obj;
                }, {});    
    
                var grouped = Object.keys(group_to_values).map(function (key) {
                    return {parentCategory: key,parentDescription:group_to_values[key][0].parentDescription,  subCategory: group_to_values[key]};
                });

                conn.release();
                return {              
                    status: 1,
                    message:"success",
                    data: grouped                      
                };             
            }
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getProduct = async (param,body) => {   
    try {
      
        var conn = await connection.getConnection();
       
        const isBrokered =  body.brokered
        const isPayroll =  body.payroll

        // const isBrokered =  1 // body.brokered
        // With Category Id
        var categoryId = param.categoryId
        const [rows]  =  await conn.execute(`SELECT products.id,products.pdf_path,products.thumbnail,products.title,products.description,
        categories.name as categoryName FROM products INNER JOIN categories ON products.categoryId = categories.id  
        WHERE categories.isDeleted = ? AND categories.isBlocked = ? AND products.isBlocked = ? AND products.isDeleted = ? 
        AND products.categoryId = ?  AND products.isBrokered = ? ORDER BY products.createdDate`,[0,0,0,0,categoryId,isBrokered]);
  
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Additional Voluntary Benefits exists.",
                    status:0
                };
        } else {

            var patientQueryData  = rows[0]
            const updatePromises = [];
            for (const key in Object.keys(patientQueryData)) {               
                console.log(patientQueryData[key])
                await getAWSUrl(patientQueryData[key]).then(async data => {
                    let temp = patientQueryData[key];
                    temp.thumbnail = data;
                    updatePromises.push(temp);
                })
            }  
            let finalResponse = await Promise.all(updatePromises).then((res) => {
                return res;              
            });
            
            conn.release();
            return {              
                status: 1,
                message:"success",
                data: _.uniq(finalResponse)                       
            };
           
        }
         
      
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getVideo = async (param,body) => {   
    try {
        var query;
        var rows, rows1;      
        var conn = await connection.getConnection();
        
        // With Category Id
        var categoryId = param.categoryId
        if(categoryId && categoryId != undefined){         
            query = `SELECT videos.id,videos.thumbnail,videos.videoPath,videos.title,videos.description,categories.id as categoryId,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = ?  AND videos.isBlocked = ? AND videos.isDeleted = ? AND videos.categoryId = ? order by videos.createdDate`
            rows1 =  await conn.execute(query,[0,0,0,categoryId]);
                   
        } else {            
            query = `SELECT videos.id,videos.thumbnail,videos.videoPath,videos.title,videos.description,categories.id as categoryId,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = ? AND videos.isBlocked = ? AND videos.isDeleted = ? order by videos.createdDate`   
            rows1 =  await conn.execute(query,[0,0,0]);         
        }

        if (rows1[0].length == 0) {
            conn.release();
            return {
                    message: "No Videos exists.",
                    status:0
                };
        } else {      
          
            var patientQueryData  = rows1[0]
            const updatePromises = [];
            for (const key in Object.keys(patientQueryData)) {              
               
                await getAWSUrl(patientQueryData[key]).then(async data => {
                    let temp = patientQueryData[key];
                    temp.thumbnail = data;
                    updatePromises.push(temp);
                })
            }  
            let finalResponse = await Promise.all(updatePromises).then((res) => {
                return res;              
            });
                    
            
            if (finalResponse.length > 0) {                 
                conn.release();
                return {              
                    status: 1,
                    message:"success",                    
                    data:finalResponse                  
                };

            }       
           
        }   
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



/** **********************************************************************
 *                  List of FAQ Related Function
 **************************************************************************/
module.exports.getFAQ = async (body) => {   
    try {
        const isBrokered =  body.brokered
        var conn = await connection.getConnection();   
        // With Category Id  CHARACTER SET utf8mb4
        // var categoryId = param.categoryId
        const [rows]  =  await conn.execute(`SELECT faq.id, faq.question, faq.answer,categories.id as category_id, categories.name FROM categories INNER JOIN faq on categories.id = faq.categoryId 
        WHERE  faq.isBrokered = ? AND faq.isBlocked = ? AND faq.isDeleted = ?  AND categories.isBlocked = ? AND  categories.isDeleted = ? `,[isBrokered,0,0,0,0]);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No FAQ exists.",
                    status:0
                };
        } else {
            const [rows1]  = await conn.execute(`SELECT faq.id, faq.question, faq.answer,categories.id as category_id, categories.name as categoryName FROM categories INNER JOIN faq on categories.id = faq.categoryId 
            WHERE  faq.isBrokered = ? AND faq.isBlocked = ? AND faq.isDeleted = ? AND categories.isBlocked = ? AND  categories.isDeleted = ? `,[isBrokered,0,0,0,0]); 
           
            var group_to_values = rows1.reduce(function (obj, item) {
                obj[item.categoryName] = obj[item.categoryName] || [];
                obj[item.categoryName].push(item);
                return obj;
            }, {});


            var grouped = Object.keys(group_to_values).map(function (key) {
                return {categoryName: key, faq: group_to_values[key]};
            });
           
            if (rows1.length > 0) {              
               
                conn.release();
                return {              
                    status: 1,
                    message:"success",
                    data: grouped                      
                };

            }
           
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}


module.exports.getProgram = async (param,body) => {   
    try {
      
        var rows
        const isBrokered =  body.brokered
        const isPayroll =  body.payroll

        // const isBrokered = 1
        // const isPayroll =  1

        var conn = await connection.getConnection();  
        // With Category Id
        var categoryId = param.categoryId
        if(categoryId && categoryId != undefined){    
           
            rows  =  await conn.execute(`SELECT 
            programs.id, programs.path, programs.thumbnail, programs.description,  programs.title, programs.type,categories.id as categoryId, categories.name as categoryName, categories.description as categoryDescription
            FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
            WHERE categories.isBlocked = ? AND categories.isDeleted = ?  AND programs.isBlocked = ? AND programs.isDeleted = ? 
            AND (programs.isBrokered = ? AND programs.isPayroll = ? AND programs.categoryId = ?)
            OR  (programs.isBrokered = ? AND programs.isPayroll = ? AND programs.categoryId = ?) 
            OR  (programs.isBrokered = ? AND programs.isPayroll = ? AND programs.categoryId = ?)             
            ORDER BY programs.createdDate`,
            [0,0,0,0, isBrokered,isPayroll,categoryId,  2,2,categoryId, isBrokered,2,categoryId]);      
            

            
        }        

        
        var patientQueryData  = rows[0]
        const updatePromises = [];
        for (const key in Object.keys(patientQueryData)) {              
            
            await getAWSUrl(patientQueryData[key]).then(async data => {
                let temp = patientQueryData[key];
                temp.thumbnail = data;
                updatePromises.push(temp);
            })

            await getAWSUrlOFT(patientQueryData[key]).then(async data => {
                let temp = patientQueryData[key];
                temp.path = data;
                updatePromises.push(temp);
            })

        }  
        let finalResponse = await Promise.all(updatePromises).then((res) => {
            return res;              
        });
        
        if (rows[0].length == 0) {
            conn.release();
            return {
                    message: "No Data Found.",
                    status:0
                };
        } 

        conn.release();
        return {              
            status: 1,
            message:"success",           
            data: _.uniq(finalResponse)
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}


/** **********************************************************************
 *                  List of Search Related Function
 **************************************************************************/
 module.exports.search = async (param,body) => {   
    try {
       
        const isBrokered =  body.brokered
        const isPayroll =  body.payroll

        // const isBrokered = 1
        // const isPayroll =  1
        var keyword = param.keyword
        var conn = await connection.getConnection(); 
      
        const [rows1]  =  await conn.execute(`SELECT 
        programs.id as programId, programs.path, programs.thumbnail, programs.description,  programs.title, programs.type,categories.id as categoryId, categories.name as categoryName, categories.description as categoryDescription
        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
        WHERE categories.isBlocked = ? AND categories.isDeleted = ?  AND programs.isBlocked = ? AND programs.isDeleted = ? 
        AND (programs.title LIKE  ? OR programs.description LIKE ?) 
        AND (programs.isBrokered = ? AND programs.isPayroll = ? )                  
        ORDER BY programs.createdDate`,
        [0,0,0,0, '%'+keyword+'%','%'+keyword+'%',isBrokered,isPayroll]); 

      
        // Query for videos
        const [rows2] = await conn.execute(`SELECT videos.id as videoId,videos.thumbnail,videos.videoPath as path,videos.title,videos.description,categories.id as categoryId,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id 
        WHERE categories.isBlocked = ? AND categories.isDeleted = ? AND categories.type = ? AND videos.isBlocked = ? AND videos.isDeleted = ? AND videos.categoryId != ?
        AND  (videos.title LIKE  ?  OR videos.description LIKE  ?) `
        ,[0,0,0,0,0,9,'%'+keyword+'%','%'+keyword+'%']); 


        // Query for products
        // const [rows3] = await conn.execute(`SELECT products.id as productId,products.name,products.title,products.pdf_path as path,products.thumbnail,products.description,categories.name as categoryName FROM products INNER JOIN categories ON 
        // products.categoryId = categories.id  
        // WHERE categories.isBlocked = ? AND categories.isDeleted = ?  AND products.isBlocked = ? 
        // AND products.isDeleted = ?  AND products.isBrokered = ?      
        // AND (products.title LIKE  ? OR products.description LIKE ? )
        // ORDER BY products.createdDate`,[0,0,0,0,isBrokered,'%'+keyword+'%','%'+keyword+'%']);

    
        let combinedArray1 = [...rows2, ...rows1]
        conn.release();

        var patientQueryData  = combinedArray1
        const updatePromises = [];
        for (const key in Object.keys(patientQueryData)) {              
            
            await getAWSUrl(patientQueryData[key]).then(async data => {
                let temp = patientQueryData[key];
                temp.thumbnail = data;
                temp.type = 1;
                updatePromises.push(temp);
            })
            
            if(patientQueryData[key].programId  != undefined){
                await getAWSUrlOFT(patientQueryData[key]).then(async data => {
                    let temp = patientQueryData[key];
                    temp.path = data;
                    temp.type = 2;
                    updatePromises.push(temp);
                })
            }
           
        }  
        let finalResponse = await Promise.all(updatePromises).then((res) => {
            return res;              
        });
        return {              
            status: 1,
            message:"success",        
            data: _.uniq(finalResponse)          
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



/** **********************************************************************
 *                  List of assigned users Function
 **************************************************************************/
module.exports.getUsers = async (body,userId) => {   
    try {
        // console.log(userId , "userId")
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput;
       
        if(body.search){
            SQlquery = `SELECT id,userId,partnerId,firstName,lastName,email,role,isBlocked,isDeleted,createdDate,updatedDate FROM users WHERE  (CONCAT( firstName, ' ', lastName )  LIKE  ? OR email LIKE ? )  AND role = ? AND userId = ? ORDER BY createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%',"Normal",userId]
            SQLCount = await conn.execute(SQlquery,SQLInput);
        } else {
            SQlquery = `SELECT users.id,users.userId,users.partnerId,partners.clientName,users.firstName,users.lastName,users.email,
            users.role,users.isBlocked,users.department,users.isDeleted,users.createdDate,users.updatedDate 
            FROM users INNER JOIN partners ON users.partnerId = partners.id  
            WHERE users.role = ?  AND users.userId = ? order by users.createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ["Normal",userId]
            SQLCount = await conn.execute(`SELECT id FROM users WHERE role = ?  AND userId = ?`,SQLInput);
        }

        const [rows]  =  await conn.execute(SQlquery,SQLInput) ;      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,
                    status:0
                };
        } else {
            const [result]  = SQLCount

            var newUserInfo = [];
        
            for (let i = 0; i < rows.length; i++) {                 
                const [result2]  =  await conn.execute('SELECT id,firstName,lastName,email,role,department,isBlocked,isDeleted,contactType,primaryContact FROM users WHERE id = ?',[rows[i].userId]);                
                newUserInfo = rows
                newUserInfo[i].addedBy = result2[0]            
               
                const [result_partner]  =  await conn.execute('SELECT * FROM partners WHERE id = ?',[rows[i].partnerId]); 
                newUserInfo[i].partner = result_partner[0] 

            }
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,
                // data: rows ,
                data: newUserInfo,
                totalRecords:result.length,
                page_number:page,          
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.addUser = async (body,userId) => {   
    try {
        var conn = await connection.getConnection();     
        let payloadData = {            
            partnerId:body.partnerId
        }     
       
        const days = 60      
        var userData = body.users       
        let partnerId,payroll,brokered,lastInsertId;
        // console.log(payloadData)
        const [rows]  =  await conn.execute('SELECT * FROM partners WHERE id = ? ',[payloadData.partnerId]);      
        if (rows.length ==  0) {
            conn.release();
            return {  
                status: 1,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
       
        partnerId = rows[0].id;
        payroll   = rows[0].payroll;
        brokered  = rows[0].brokered;
        conn.release();
       

        const password = generatePassword();                 
        const hashPassword = await bcrypt.hash(password, 12);

        var dataURL = {
            userId:userId,
            partnerId:partnerId,
            firstName:body.firstName,
            lastName:body.lastName,
            email:body.email,
            contactType:body.contactType,
            // primaryContact:body.primaryContact ,
            password:hashPassword,
            pwd:password,
            siteAccess:1,
            payroll:payroll,
            brokered:brokered,
            invitationExpire: Date.now() + days*24*60*60*1000, 
        }
        // console.log("dataURL ---------")
        // console.log(dataURL)
        const result  = await commonModel.insertData('users',dataURL);
        lastInsertId = result.insertId
            
        let emailData = {}   
        let PdfFilepath = {}  
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';
    
        const subject = "Liberty Mutual - SignUp";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to = body.email;     
        emailData.password = password
        emailData.logo = BaseURL+'/liberty_logo_second.png' 
        emailData.email = body.email;
        emailData.web_url = "https://www.lmpartnerportal.com"
        
        const message = await signupTemplate.signupTemplate(emailData)
        const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
        if( mailRes.accepted != undefined){
            await conn.execute('UPDATE users SET mailSent = ? WHERE id = ?',[1,lastInsertId]);
            conn.release();                     
        }  
        conn.release(); 
        conn.release();
        return {  
            status: 1,
            message: ERROR_MSG.SUCCESS,          
        };

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getUserList = async (body) => {   
    try {
    
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        const [rowsPartner]  =  await conn.execute('SELECT partnerId FROM user_urls WHERE userId = ? ',[body.userId]);      
        if (rowsPartner.length ==  0) {
            conn.release();
            return {  
                status: 0,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        // console.log("--- rrowsPartner -")
        // console.log(rowsPartner)
        conn.release();
        var partnerIds  = [];
        for(var i = 0; i < rowsPartner.length; i++){
            partnerIds.push(rowsPartner[i].partnerId)
        }

        // console.log(" --- partnerData ---")
        // console.log(partnerIds.join()) 

        const [rowsPartner2]  =  await conn.execute('SELECT userId FROM user_urls WHERE partnerId IN (?)',[partnerIds.join()]);      
        if (rowsPartner2.length ==  0) {
            conn.release();
            return {  
                status: 0,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        // console.log(" --- rowsPartner2 ---")
        // console.log(rowsPartner2)

        var userIds  = [];
        for(var i = 0; i < rowsPartner2.length; i++){
            userIds.push(rowsPartner2[i].userId)
        }

        // console.log(" -- userids ----")
        // console.log(userIds.join())

        var SQlquery,SQLInput;
       
        if(body.search){
            SQlquery = `SELECT users.id,users.userId,
                        users.firstName,users.lastName,users.email,users.primaryContact,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE  
                        (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? )  
                        AND users.role = ? 
                        AND users.id IN (${userIds.join()})
                        ORDER BY users.createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%',"Normal"]
            SQLCount = await conn.execute(SQlquery,SQLInput);
        } else {
            SQlquery = `SELECT users.id,users.userId,
                        users.firstName,users.lastName,users.email,users.primaryContact,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE 
                        users.role = ?  
                        AND users.id IN (${userIds.join()})
                        ORDER BY  users.createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ["Normal"]
            SQLCount = await conn.execute(`SELECT id FROM users WHERE role = ? AND users.id IN (${userIds.join()})`,SQLInput);
        }

        // console.log(SQlquery)
        const [rows]  =  await conn.execute(SQlquery,SQLInput) ;      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,
                    status:0
                };
        } else {
            const [result]  = SQLCount
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,
                data: rows ,
                totalRecords:result.length,
                page_number:page,          
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getClientList = async (body) => {   
    try {
        

        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        const [rowsPartner]  =  await conn.execute('SELECT partnerId FROM user_urls WHERE userId = ? ',[body.userId]);      
        if (rowsPartner.length ==  0) {
            conn.release();
            return {  
                status: 0,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        // console.log("--- rrowsPartner -")
        // console.log(rowsPartner)
        conn.release();
        var partnerIds  = [];
        for(var i = 0; i < rowsPartner.length; i++){
            partnerIds.push(rowsPartner[i].partnerId)
        }

        // console.log(" --- partnerData ---")
        // console.log(partnerIds.join()) 

        const [rowsPartner2]  =  await conn.execute('SELECT userId FROM user_urls WHERE partnerId IN (?)',[partnerIds.join()]);      
        if (rowsPartner2.length ==  0) {
            conn.release();
            return {  
                status: 0,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        // console.log(" --- rowsPartner2 ---")
        // console.log(rowsPartner2)

        var userIds  = [];
        for(var i = 0; i < rowsPartner2.length; i++){
            userIds.push(rowsPartner2[i].userId)
        }

        // console.log(" -- userids ----")
        // console.log(userIds.join())

        var SQlquery,SQLInput;
       
        if(body.search){
            SQlquery = `SELECT users.id,users.userId,
                        users.firstName,users.lastName,users.email,users.primaryContact,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE  
                        (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? )  
                        AND users.role = ? 
                        AND users.id IN (${userIds.join()})
                        ORDER BY users.createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%',"Normal"]
            SQLCount = await conn.execute(SQlquery,SQLInput);
        } else {
            SQlquery = `SELECT users.id,users.userId,
                        users.firstName,users.lastName,users.email,users.primaryContact,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE 
                        users.role = ?  
                        AND users.id IN (${userIds.join()})
                        ORDER BY  users.createdDate limit ${limit} OFFSET ${offset}`
            SQLInput = ["Normal"]
            SQLCount = await conn.execute(`SELECT id FROM users WHERE role = ? AND users.id IN (${userIds.join()})`,SQLInput);
        }

        // console.log(SQlquery)
        const [rows]  =  await conn.execute(SQlquery,SQLInput) ;      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,
                    status:0
                };
        } else {
            const [result]  = SQLCount
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,
                data: rows ,
                totalRecords:result.length,
                page_number:page,          
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}


/** **********************************************************************
 *                  List of Manage& non-manager Function
 **************************************************************************/


/** **********************************************************************
 *                  List of General Function
 **************************************************************************/
function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function generateRandomString (stringLength) {
	let text = '';
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$_";

	do {
		text = '';
		for (let i = 0; i < stringLength; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
	} while (!(/((?=.*\d)(?=.*[A-Z])(?=.*\W).{8,8})/.test(text)));
	return text;
};

async function getAWSUrl(item){
    var paramsFirst = {
        Key: item.thumbnail,
        Bucket: 'lmpp-bucket',
        Expires: 86400 
    }
    return new Promise((resolve,reject) => {
        s3.getSignedUrl('getObject', paramsFirst, function (err, url) {
            if (err) reject(err);
            resolve(url);
        })
    })
    
}

async function getAWSUrlOFT(item){
    var paramsFirst = {
        Key: item.path,
        Bucket: 'lmpp-bucket',
        Expires: 86400 
    }
    return new Promise((resolve,reject) => {
        s3.getSignedUrl('getObject', paramsFirst, function (err, url) {
            if (err) reject(err);
            resolve(url);
        })
    })
    
}

