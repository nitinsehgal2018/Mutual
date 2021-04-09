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
const { exit } = require('process');


/** **********************************************************************
 *                  List of User Related Function
 **************************************************************************/
module.exports.login = async (email, password) => {   
    try {        
        var conn = await connection.getConnection();     
        const [rows, fields]  =  await conn.execute('SELECT * FROM users WHERE email = ? AND role = "Normal"',[email]); 
      
        if (rows.length > 0) {
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

                //genrate json web token
                const token = jwt.sign({
                    email: email,
                    user_id: rows[0].id,
                    user_type :"Normal"
                }, process.env.JWT_KEY, {
                    expiresIn: "2d"
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
        }
        return {
            message: "Incorrect email address or Password.",
            loggedin: 0
        };
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

        const [rows, fields]  =  await conn.execute('SELECT * FROM users WHERE email = ? ',[body.email]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email already  exists.",
                    loggedin: 0
                };
        } else {
    
            const [rows, fields]  = await conn.execute(`INSERT INTO users (email,firstName,lastName,role,phone,password) VALUES(?,?,?,?,?,?)`,
            [payloadData.email,payloadData.firstName,payloadData.lastName, payloadData.role,payloadData.phone,hashPassword]) ;
            
            const lastInsertId = rows.insertId;     
                    
            const subject = "Liberty Mutual - SignUp";
            const from = 'Liberty Mutual Admin<testing.mobileprogramming@gmail.com>';
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
            const mailResponse = mail.mailfunction(from, to, subject, message);

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

module.exports.resetPassword = async (req) => {
    try {
        var conn = await connection.getConnection();     
        var [rows,fields] =  await conn.execute('SELECT * FROM users WHERE id = ? ',[req.userId]); 
        console.log("REsult  reset password ==")
        console.log(rows)
        const password = await bcrypt.hash(req.new_pass, 12);            
        await conn.execute('UPDATE users SET password = ? WHERE id = ?',[ password, req.userId]);
        await conn.execute('UPDATE users SET firstTimeLogin = ? WHERE id = ?',[ 1, req.userId]);
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
        var [rows,fields] =  await conn.execute('SELECT * FROM users WHERE id = ? ',[req.userId]); 
        console.log("REsult  change password ==")
        console.log(rows)
        const isEqual = await bcrypt.compare(req.current_pass, rows[0].password);
        if (!isEqual) {
            conn.release();
            return {
                message: "The old password you have entered is incorrect.",
                statusCode: 500
            };
        } else {
            const password = await bcrypt.hash(req.new_pass, 12);            
            var result =  await conn.execute('UPDATE users SET password = ? WHERE id = ?',[ password, req.userId]);
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM users WHERE id = ?',[req.userId]);  
        delete rows[0].password;    
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No users exists.",
                    status:0
                };
        } else {
    
            conn.release();
            return {              
                status: 1,
                message:"success",
                data: rows           
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
    const subject = "Liberty Mutual - Password Reset Confirmation!";
    const from = 'Liberty Mutual Admin<testing.mobileprogramming@gmail.com>';
    const to = email;
    var conn = await connection.getConnection();
    const [rows, fields] =  await conn.execute('SELECT * FROM users WHERE email = ? AND isDeleted = 0  AND role = ? ',[email,"Normal"]); 
  
    if (rows.length == 0) {
        await conn.release()
        conn.release();
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
   
    var rs = await conn.execute('UPDATE users SET password = ?, resetPasswordToken = ? , resetPasswordExpire = ? WHERE id = ?',[hashPassword,resetToken,resetTokenExpire,userId]);
    await conn.release();
    let payloadData = {}
    payloadData.password = password
    payloadData.first_name = first_name
    // payloadData.logo = 'https://lmelg-api.mobileprogramming.net/liberty_Logo_fill.jpg'
    payloadData.logo = BaseURL+'/liberty_Logo_fill.jpg'

    // create url form reset password
   
    const url = `https://dev.liberty.com?resetToken=${resetToken}`;
    payloadData.url = url;
    const message = await template.forgotTemplate(payloadData)
    const mailResponse = mail.mailfunction(from, to, subject, message)
    return {    
        message:'success'  ,
        status:1                  
    };
}

module.exports.resetForgotPassword = async (req) => {
    try {
       
        var conn = await connection.getConnection();   
        let time_now = Date.now() ; 
        var [rows,fields] =  await conn.execute('SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire >= ?',[req.resetPasswordToken,time_now]); 
        if(rows.length == 0){
            return {    
                message:'Password reset token is invalid or has expired.'  ,
                status:1                  
            };
        }
      
        const password = await bcrypt.hash(req.new_pass, 12);            
        await conn.execute('UPDATE users SET password = ? , resetPasswordToken = ? , resetPasswordExpire =?  WHERE id = ?',[ password,'','',rows[0].id]);      
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
 *                  List of New Products Related Function
 **************************************************************************/
module.exports.getProduct = async (body) => {   
    try {
        const limit = 3 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();   
        const [rows, fields]  =  await conn.execute(`SELECT * FROM products order by name limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Product exists.",
                    status:0
                };
        } else {
            const [result, fields]  =  await conn.execute(`SELECT * FROM products order by name`);
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.getVideo = async (body) => {   
    try {
      
        var conn = await connection.getConnection();   
        const [rows, fields]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Videos exists.",
                    status:0
                };
        } else {
            const [rows1, fields]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate`);
            var group_to_values = rows1.reduce(function (obj, item) {
                obj[item.categoryName] = obj[item.categoryName] || [];
                obj[item.categoryName].push(item);
                return obj;
            }, {});


            var grouped = Object.keys(group_to_values).map(function (key) {
                return {categoryName: key, Video: group_to_values[key]};
            });

            if (rows1.length > 0) {                 
                conn.release();
                return {              
                    status: 1,
                    message:"success",
                    data: grouped                      
                };

            }

            conn.release();
            return {              
                status: 1,
                message:"success",
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
 *                  List of FAQ Related Function
 **************************************************************************/
module.exports.getFAQ = async (body) => {   
    try {
        
        var conn = await connection.getConnection();   
        const [rows, fields]  =  await conn.execute(`SELECT categories.id as category_id, categories.name , faq.question, faq.answer FROM categories INNER JOIN faq on categories.id = faq.categoryId WHERE categories.type = 1`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No FAQ exists.",
                    status:0
                };
        } else {
            const [rows1, fields]  = await conn.execute(`SELECT categories.id as category_id, categories.name as categoryName , faq.question, faq.answer FROM categories INNER JOIN faq on categories.id = faq.categoryId WHERE categories.type = 1  ORDER BY categories.name ASC `);
           
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


module.exports.getProgram = async (body) => {   
    try {
    
        var conn = await connection.getConnection();  
        const [row, fields_row]  =  await conn.execute(`SELECT 
        programs.id, programs.path, programs.description,  programs.title, programs.type, categories.name as categoryName, categories.description as categoryDescription
        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
        WHERE categories.isBlocked = 0 AND categories.isDeleted = 0 AND categories.type = 2 AND programs.isBlocked = 0 AND programs.isDeleted = 0 order by programs.createdDate`);      
  
        
        const [result, fields]  =  await conn.execute(`SELECT 
        programs.id, programs.path, programs.description,  programs.title, programs.type, categories.name as categoryName, categories.description as categoryDescription
        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
        WHERE categories.isBlocked = 0 AND categories.isDeleted = 0 AND categories.type = 2 AND programs.isBlocked = 0 AND programs.isDeleted = 0  AND programs.type = 0 order by programs.createdDate`);      
  
    
        const [result2, fields2]  =  await conn.execute(`SELECT 
        programs.id, programs.path, programs.description,  programs.title, programs.type, categories.name as categoryName, categories.description as categoryDescription
        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
        WHERE categories.isBlocked = 0 AND categories.isDeleted = 0 AND categories.type = 2 AND programs.isBlocked = 0 AND programs.isDeleted = 0  AND programs.type = 1 order by programs.createdDate`);      


        const [result3, fields3]  =  await conn.execute(`SELECT 
        programs.id, programs.path, programs.description,  programs.title , programs.type , categories.name as categoryName, categories.description as categoryDescription
        FROM programs INNER JOIN categories ON programs.categoryId = categories.id  
        WHERE categories.isBlocked = 0 AND categories.isDeleted = 0 AND categories.type = 2 AND programs.isBlocked = 0  AND programs.isDeleted = 0  AND programs.type = 2 order by programs.createdDate`,
        []);      

        var group_to_values = row.reduce(function (obj, item) {
            obj[item.categoryName] = obj[item.categoryName] || [];
            // obj[item.categoryDescription] = obj[item.categoryDescription] || [];
            obj[item.categoryName].push(item);
            return obj;
        }, {});


        var grouped = Object.keys(group_to_values).map(function (key) {
            console.log(group_to_values)
            return {categoryName: key,categoryDescription:group_to_values[key][0].categoryDescription, data: group_to_values[key]};
        });
        conn.release();
        return {              
            status: 1,
            message:"success",
            data:grouped,
            // data: result ,
            // data_benefit:result2,
            // data_slide:result3,
              
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



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
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*()_";

	do {
		text = '';
		for (let i = 0; i < stringLength; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
	} while (!(/((?=.*\d)(?=.*[A-Z])(?=.*\W).{8,8})/.test(text)));
	return text;
};



