'user strict';
const  connection  = require('../../../db.js');
const  template =  require('../../emailTemplate/signupTemplate')
const  forgotTemplate =  require('../../emailTemplate/forgotTemplate')
const  adminTemplate =  require('../../emailTemplate/adminSignupTemplate')
const  adminResetTemplate =  require('../../emailTemplate/resetPasswordTemplate')
const commonModel = require('../commonModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mail = require('../../middleware/mail.js');
const readXlsxFile = require("read-excel-file/node");
const path = require('path');     
const AWS = require("aws-sdk");
const { exit } = require('process');
const mysql = require('mysql2');
const  ERROR_MSG =   require('../../middleware/message.json')
const CryptoJS = require("crypto-js");

/* login user method */
module.exports.login = async (email, password,role) => {   
    try {        
        var conn = await connection.getConnection();     
        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ?',[email]); 
        // const [rows]  =  await conn.execute('SELECT * FROM admin WHERE email = ? AND role = ?',[email,role]); 
        if (rows.length > 0) {
            if(rows[0].isDeleted == 1){
                conn.release();
                return {                   
                    message: ERROR_MSG.ACC_DELETE,
                    loggedin: 0
                };
            }
            if(rows[0].isBlocked == 1){
                conn.release();
                return {
                    message: ERROR_MSG.ACC_BLOCK,
                    loggedin: 0
                };
            }
            const isEqual = await bcrypt.compare(password, rows[0].password);           
            if (!isEqual) {
                conn.release();
                return {                    
                    message: ERROR_MSG.INCORRECT_PWD,
                    loggedin: 0
                };
            }
            else {

                //genrate json web token
                const token = jwt.sign({
                    email: email,
                    user_id: rows[0].id,
                    user_type :rows[0].role
                }, process.env.JWT_KEY, {
                    expiresIn: "20d"
                });
                conn.release();
                rows[0].token = token 
                delete rows[0].password              
                return {  
                    message:ERROR_MSG.SUCCESS,     
                    data:rows[0],     
                    status:1,
                    loggedin: 1
                };
            }
        }
        return {
            message:ERROR_MSG.INCORRECT_EMAIL,     
            loggedin: 0
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

/** **********************************************************************
*                  List of ADD/Edit/Delete ADMIN Related Function
**************************************************************************/
module.exports.addSuperAdmin = async (body) => {   
    
    try {      
        var conn = await connection.getConnection();     
        let payloadData = {            
            email :body.email, 
            firstName:body.name, 
            password:body.password,
            role:"SuperAdmin"
        }     
        payloadData.password = 'qwerty'
        const hashPassword = await bcrypt.hash(payloadData.password, 12);    
        payloadData.password = hashPassword;      
        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ? AND isDeleted = ? AND role = ?',[payloadData.email,0,payloadData.role]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: ERROR_MSG.EMAIL_ALREADY_EXISTS,
                    loggedin: 0
                };
        } else {
            
            const rows = await commonModel.insertData('users',payloadData); 
            const subject = "Liberty Mutual - Welcome to Admin Portal!";
            const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
            const to = payloadData.email;
            payloadData.logo = BaseURL+'/liberty_logo_second.png'
            payloadData.password = body.password           
            payloadData.web_url = "https://www.lmpartnerportal.com/admin/login"
            const message = await adminTemplate.signupAdminTemplate(payloadData)
            // const mailResponse = mail.mailfunction(from, to, subject, message);

            conn.release();
            return {  
                message: ERROR_MSG.SUCCESS,     
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

module.exports.getDepartment = async (body) => {   
    try {
        var conn = await connection.getConnection();  
      
        const [rows]  =  await conn.execute(`SELECT * FROM department  ORDER BY name ASC`) ;     
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,   
                    status:0
                };
        } else {
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,   
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

module.exports.addAdmin = async (body) => {   
    try {
       
        var conn = await connection.getConnection();     
        let payloadData = { 
            email :body.email,          
            firstName:body.firstName,
            lastName:body.lastName,
            departmentId:body.departmentId,
            userId:body.userId,          
            role:"Admin"
        }     
        let randomPassword = generatePassword();
        const hashPassword = await bcrypt.hash(randomPassword, 12);    
        payloadData.password = hashPassword;      
        payloadData.pwd = randomPassword;      
        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ? AND isDeleted = ? AND role = ?',[payloadData.email,0,payloadData.role]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: ERROR_MSG.EMAIL_ALREADY_EXISTS,
                    loggedin: 0
                };
        } else {
            conn.release();
            const rows = await commonModel.insertData('users',payloadData); 
            const subject = "Liberty Mutual - Welcome to Admin Portal!";
            const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
            const to = payloadData.email;
            payloadData.logo = BaseURL+'/liberty_logo_second.png'
            payloadData.password = randomPassword         
            payloadData.web_url = "https://www.lmpartnerportal.com/admin/login"
            const message = await adminTemplate.signupAdminTemplate(payloadData)
            // const mailResponse = mail.mailfunction(from, to, subject, message);

            conn.release();
            return {    
                message: ERROR_MSG.SUCCESS,     
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

module.exports.getAdmin = async (body) => {   
    try {
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput;
       
        if(body.search){
            SQlquery = `SELECT users.id,users.userId,users.departmentId, department.name as departmentName,
                        users.firstName,users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users INNER JOIN department on users.departmentId = department.id 
                        WHERE (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? OR department.name LIKE ? )
                        AND users.role = ? 
                        ORDER BY users.createdDate DESC limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%','%'+body.search+'%',"Admin"]
            SQLCount = await conn.execute(SQlquery,SQLInput);
            conn.release();
        } else {
            SQlquery = `SELECT users.id,users.userId,users.departmentId, department.name as departmentName,
                        users.firstName,users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users INNER JOIN department on users.departmentId = department.id WHERE users.role = ?  
                        ORDER BY  users.createdDate DESC limit ${limit} OFFSET ${offset}`
            SQLInput = ["Admin"]
            SQLCount = await conn.execute(`SELECT id FROM users WHERE role = ?`,SQLInput);
            conn.release();
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

module.exports.blockUnblockAdmin = async (isBlock, userId) => {
    try {
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,"Admin"]);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    status: 0,
                    message: ERROR_MSG.ADMIN_NOT_EXISTS
                };
        }  
        //if user type is 1 and is_block=1
        if ( isBlock == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.BLOCK,                             
                };
            }
        }
        else if ( isBlock == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.UNBLOCK,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.deleteAdmin = async (userId) => {
    try {   
       var  conn = await connection.getConnection();
       
       const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,"Admin"]);  
       if (rows.length  == 0) {
            conn.release();
            return {
                message: ERROR_MSG.NO_RECORD,     
                status: 0
            };           
       } 

        const [rowsCheck]  =  await conn.execute('SELECT id FROM users WHERE userId = ?',[userId]);  
        if (rowsCheck.length > 0) {
            conn.release();
            return {
                message: ERROR_MSG.DEL_ADMIN,     
                status: 0
            };           
       } 

       const result = await conn.execute(`DELETE from users WHERE id = ? AND role = ? `, [userId,"Admin"]);
       conn.release();
       return {
           message: ERROR_MSG.SUCCESS,     
           status: 1
       };

    } catch (error) {
        conn.release();
    }
}

module.exports.updateAdmin = async (req) => {
    try {
        var conn = await connection.getConnection();  
        
        let userId = req.userId
        delete req.userId;       
       
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ?',[userId,"Admin"]);      
        if (rows.length > 0) {          
            const result = await commonModel.updateData('users',userId, req);
            const rowsData  = await commonModel.getAdminByUid(userId);      
            conn.release(); 
            return {    
                message: ERROR_MSG.SUCCESS,   
                status:1,
                data:rowsData             
            };
        } else {           
             conn.release();
             return {
                 message: ERROR_MSG.NO_RECORD,     
                 status: 0
             };
        } 

        
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.updateProfile = async (req,userId) => {
    try {
        console.log(req.type+" "+userId)
        var conn = await connection.getConnection();  

        if(req.type == 'SuperAdmin'){
            var [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ?',[userId,"SuperAdmin"]);   
        }
        if(req.type == 'Admin'){
            var [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ?',[userId,"Admin"]);  
        }
        if(req.type == 'Normal'){
            var [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ?',[userId,"Normal"]);  
        }
        // const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
        if (rows.length == 0) { 
            conn.release(); 
            return {    
                message: ERROR_MSG.NO_RECORD,     
                status: 0          
            };
        }
        delete req.type;
        await commonModel.updateData('users',userId, req);
        await commonModel.getUserByUid(userId);      
        conn.release(); 
        return {    
            message: ERROR_MSG.PROFILE_UPDATE,   
            status:1           
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}





module.exports.getProfile = async (userId) => {   
    try {         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT id,firstName,lastName,email,brokered,payroll,contactType, primaryContact,manager, role, isBlocked,isDeleted FROM users WHERE id = ?',[userId]); 
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No users exists.",
                    status:0
                };
        } 
         
        conn.release();
        return {              
            status: 1,
            message:"success",
            data:rows[0]         
        };
           
        
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.changePassword = async (req,userId) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT * FROM users WHERE id = ? ',[userId]); 
        const isEqual = await bcrypt.compare(req.current_pass, rows[0].password);
        if (!isEqual) {
            conn.release();
            return {
                message: ERROR_MSG.OLD_PWD_INCORRECT,     
                statusCode: 500
            };
        } else {
            conn.release();
            const password = await bcrypt.hash(req.new_pass, 12);            
            var result =  await conn.execute('UPDATE users SET password = ? WHERE id = ?',[password, userId]);
            conn.release(); 
            return {    
                message: ERROR_MSG.PWD_UPDATE,   
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

    const subject = "Liberty Mutual - Admin - Forgot Password!";
    const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
    const to = email;
    var conn = await connection.getConnection();

    const [rows] =  await conn.execute('SELECT id, firstName, lastName FROM users WHERE email = ? AND isDeleted = ?',[email,0]);   
    if (rows.length == 0) {
        conn.release()
        return {
            message: ERROR_MSG.EMAIL_NOT_EXISTS,  
            status:0
        };
    }
    conn.release();
    const password = generatePassword();
    let resetToken = generateRandomString(50);
    let resetTokenExpire = Date.now() + 3600000;
    const hashPassword = await bcrypt.hash(password, 12);
    const first_name = rows[0].firstName ?  rows[0].firstName : '';
    const userId = rows[0].id;
   
    var rs = await conn.execute('UPDATE users SET resetPasswordToken = ? , resetPasswordExpire = ? WHERE id = ?',[resetToken,resetTokenExpire,userId]);
    conn.release();
    let payloadData = {}
    payloadData.password = password
    payloadData.first_name = first_name    
    payloadData.logo = BaseURL+'/liberty_logo_second.png'    
    // create url form reset password
   
    const url = `https://www.lmpartnerportal.com/reset/admin/${resetToken}`;
    payloadData.url = url;
    const message = await forgotTemplate.forgotTemplate(payloadData)
    const mailResponse = mail.mailfunction(from, to, subject, message)
    return {    
        message: ERROR_MSG.SUCCESS,
        status:1                  
    };
}

module.exports.resetForgotPassword = async (req) => {
    try {
       
        var conn = await connection.getConnection();   
        let time_now = Date.now() ; 
        var [rows] =  await conn.execute('SELECT * FROM admin WHERE resetPasswordToken = ? AND resetPasswordExpire >= ?',[req.resetPasswordToken,time_now]); 
        if(rows.length == 0){
            conn.release(); 
            return {    
                message:'Password reset token is invalid or has expired.'  ,
                status:0              
            };
        }
      
        const password = await bcrypt.hash(req.new_pass, 12);            
        await conn.execute('UPDATE admin SET password = ? , resetPasswordToken = ? , resetPasswordExpire = ?  WHERE id = ?',[password,'','',rows[0].id]);      
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

module.exports.resetAdminPassword = async (req) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[req.userId,'Admin']); 
        if(rows[0].length == 0 ){
            conn.release();
            return {    
                message:'Admin does not exists'  ,
                status: 0           
            };
        }

        const randomPassword = generatePassword();
        const payloadData = {}
        const password = await bcrypt.hash(randomPassword, 12);            
        await conn.execute('UPDATE users SET password = ? WHERE id = ?',[password,req.userId]);
        conn.release(); 
        conn.release(); 
        const subject = "Liberty Mutual - Admin - Reset Password";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to = rows[0].email;
        payloadData.logo = BaseURL+'/liberty_logo_second.png'
        payloadData.password = randomPassword          
        payloadData.web_url = "https://www.lmpartnerportal.com/admin/login"
        const message = await adminResetTemplate.resetPasswordTemplate(payloadData)
        const mailResponse = mail.mailfunction(from, to, subject, message);
        return {    
            message: ERROR_MSG.PWD_RESET,
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
 *        List of Partner/organization and users
 **************************************************************************/

 module.exports.addPartner = async (body,userId) => {   
    try {
        // console.log(userId)
        var conn = await connection.getConnection();     
        let payloadData = {            
            clientName:body.partnerName,           
            payroll:body.payroll,
            brokered:body.brokered ,
            url:body.emailUrl
        }     
       
        const days = 60      
        var userData = body.users 
      
        let partnerId;
        
        const [rows]  =  await conn.execute('SELECT * FROM partners WHERE clientName = ? AND isDeleted = ? ',[payloadData.clientName,0]);      
        if (rows.length > 0) {
            partnerId = rows[0].id;
            console.log(partnerId, " partnerId ")
            conn.release();
            for(var i = 0; i < userData.length; i++){

                const password = generatePassword();                 
                const hashPassword = await bcrypt.hash(password, 12);
                
                var dataURL = {
                    userId:userId,
                    partnerId:partnerId,
                    firstName:userData[i].firstName,
                    lastName:userData[i].lastName,
                    email:userData[i].email,
                    contactType:userData[i].contactType,
                    primaryContact:userData[i].primaryContact ,
                    manager:userData[i].manager,
                    password:hashPassword,
                    pwd:password,
                    siteAccess:1,
                    payroll:body.payroll,
                    brokered:body.brokered,
                    invitationExpire: Date.now() + days*24*60*60*1000, 
                }
             
                console.log(dataURL)
                var rowsUser =  await commonModel.insertData('users',dataURL);
                conn.release();
                const lastInsertId = rowsUser.insertId;   
                var mappingData = {
                    partnerId:partnerId,
                    userId:lastInsertId
                }
                await commonModel.insertData('user_urls',mappingData);


                let emailData = {}   
                let PdfFilepath = {}  
                PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
                PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';
        
                const subject = "Liberty Mutual - SignUp";
                const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
                const to = userData[i].email;     
                emailData.password = password
                emailData.logo = BaseURL+'/liberty_logo_second.png' 
                emailData.email = userData[i].email;
                emailData.web_url = "https://www.lmpartnerportal.com"
               
                const message = await template.signupTemplate(emailData)
                // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
            }
            conn.release();
            return {  
                status: 1,
                message: ERROR_MSG.SUCCESS,          
            };
     
        } else {
            
            const rows = await commonModel.insertData('partners',payloadData);
            // console.log(rows)
            partnerId = rows.insertId;     
            console.log(partnerId, " partnerId ELSE ")
            // insert URLs
          
           
            for(var i = 0; i < userData.length; i++){

                const password = generatePassword();                 
                const hashPassword = await bcrypt.hash(password, 12);

                var dataURL = {
                    userId:userId,
                    partnerId:partnerId,
                    firstName:userData[i].firstName,
                    lastName:userData[i].lastName,
                    email:userData[i].email,
                    contactType:userData[i].contactType,
                    primaryContact:userData[i].primaryContact ,
                    manager:userData[i].manager,
                    password:hashPassword,
                    pwd:password,
                    siteAccess:1,
                    payroll:body.payroll,
                    brokered:body.brokered ,
                    invitationExpire: Date.now() + days*24*60*60*1000, 
                }
               
               
                // await commonModel.insertData('users',dataURL);
                var rowsUser =  await commonModel.insertData('users',dataURL);
                const lastInsertId = rowsUser.insertId;   
                var mappingData = {
                    partnerId:partnerId,
                    userId:lastInsertId
                }
                await commonModel.insertData('user_urls',mappingData);
                conn.release();
                let emailData = {}   
                let PdfFilepath = {}  
                PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
                PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';
        
                const subject = "Liberty Mutual - SignUp";
                const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
                const to = userData[i].email;     
                emailData.password = password
                emailData.logo = BaseURL+'/liberty_logo_second.png' 
                emailData.email = userData[i].email;
                emailData.web_url = "https://www.lmpartnerportal.com"
               
                const message = await template.signupTemplate(emailData)
                // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
            }

          
            conn.release();
            return {  
                status: 1,
                message: ERROR_MSG.SUCCESS,          
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.assignUserToPartner = async (body,userId) => {   
    try {
        var conn = await connection.getConnection();     
        let payloadData = {            
            partnerId:body.partnerId
        }     
       
        const days = 60      
        var userData = body.users       
        let partnerId,payroll,brokered,lastInsertId;
        console.log(userData)
        const [rows]  =  await conn.execute('SELECT id,payroll,brokered FROM partners WHERE id = ? ',[payloadData.partnerId]);      
        if (rows.length ==  0) {
            conn.release();
            return {  
                status: 1,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        conn.release();

        partnerId = rows[0].id;
        payroll   = rows[0].payroll;
        brokered  = rows[0].brokered;

        let emailData = {}   
        let PdfFilepath = {}  
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';
        const subject = "Liberty Mutual - SignUp";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';

        for(var i = 0; i < userData.length; i++){
            conn.release();
            const password = generatePassword();                 
            const hashPassword = await bcrypt.hash(password, 12);
            const [rowsUser]   =  await conn.execute('SELECT * FROM users WHERE email = ? ',[userData[i].email]);      
            if (rowsUser.length >  0) { // If user already exists in database
                conn.release();
                var dataURL = {
                    partnerId:partnerId,
                    userId:rowsUser[0].id
                }
                const [checkUser]  =  await conn.execute('SELECT id FROM user_urls WHERE partnerId = ? AND userId = ?',[partnerId,rowsUser[0].id]);  
                if (checkUser.length  ==   0) {
                    conn.release();
                    await commonModel.insertData('user_urls',dataURL);

                    // send invitation mail but without password
                    const to = userData[i].email;     
                    emailData.password = password
                    emailData.logo = BaseURL+'/liberty_logo_second.png' 
                    emailData.email = userData[i].email;
                    emailData.web_url = "https://www.lmpartnerportal.com"                    
                    const message = await template.signupTemplate(emailData)
                    // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);                   


                }   
                conn.release();            
    
            } else {
                // New user added under partner
                var dataURL = {
                    userId:userId,
                    partnerId:partnerId,
                    firstName:userData[i].firstName,
                    lastName:userData[i].lastName,
                    email:userData[i].email,
                    contactType:userData[i].contactType,
                    manager:userData[i].manager,
                    primaryContact:userData[i].primaryContact ,
                    password:hashPassword,
                    pwd:password,
                    siteAccess:1,
                    payroll:payroll,
                    brokered:brokered,
                    invitationExpire: Date.now() + days*24*60*60*1000, 
                }
                const result  = await commonModel.insertData('users',dataURL);
                const lastInsertId = result.insertId
                conn.release();
                var mappingData = {
                    partnerId:partnerId,
                    userId:lastInsertId
                }
                await commonModel.insertData('user_urls',mappingData);
               
                const to = userData[i].email;     
                emailData.password = password
                emailData.logo = BaseURL+'/liberty_logo_second.png' 
                emailData.email = userData[i].email;
                emailData.web_url = "https://www.lmpartnerportal.com"
                
                const message = await template.signupTemplate(emailData)
                // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
                // if( mailRes.accepted != undefined){
                //     await conn.execute('UPDATE users SET mailSent = ? WHERE id = ?',[1,lastInsertId]);
                //     conn.release(); 
                //     conn.release();              
                // }  


            }
           
    
            conn.release(); 
        }


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

module.exports.deletePartner = async (partnerId) => {
    try {     
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM partners WHERE id = ?',[partnerId]);      
        if (rows.length ==  0) { 
            conn.release();
             return {
                 message: ERROR_MSG.NO_RECORD,     
                 status: 0
             };         
        }
        
       const result = await conn.execute(`DELETE from partners WHERE id = ? `, [partnerId]);
       await conn.execute(`DELETE from users  WHERE userId = ? `, [partnerId]);
       conn.release();
       conn.release();
       return {
            message: ERROR_MSG.SUCCESS,     
            status: 1
        };   

    } catch (error) {       
        conn.release();
    }
}

module.exports.getPartner = async (body) => {   
    try {

        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput,SQLCount;
       
        if(body.search){
            SQlquery = `SELECT * FROM partners WHERE (clientName LIKE ? OR email LIKE ? ) ORDER BY clientName DESC`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%']
            SQLCount = await conn.execute(SQlquery,SQLInput);
            conn.release();
        } else {
            SQlquery = `SELECT * FROM partners  order by clientName DESC`
            SQLInput = [""]
            SQLCount = await conn.execute(`SELECT id FROM partners`,SQLInput);
            conn.release();
        }

        const [rows]  =  await conn.execute(SQlquery,SQLInput) ;     
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,   
                    status:0
                };
        } else {
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,   
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

module.exports.getAllPartnerOLD = async (body,userId,userType) => {   
    try {
        console.log(userId , "userId")
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput;

        // for filter purpose
        var SQLArray = []
        // SQlqueryold = `SELECT users.id,users.userId,users.partnerId,users.firstName,
        //             users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,
        //             users.createdDate,users.updatedDate FROM users WHERE isBlocked != ? `;
                    
        // SQlquery_new = `SELECT users.id,users.userId,users.partnerId,users.firstName,
        // users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,
        // users.createdDate,users.updatedDate FROM users WHERE isBlocked != ? `;

        SQlquery = `SELECT users.id,users.userId,users.partnerId,users.firstName, users.lastName,users.email,
                users.role,users.contactType,users.manager,
                users.primaryContact,users.isBlocked,users.isDeleted,users.createdDate,users.updatedDate
                FROM user_urls 
                INNER JOIN users on user_urls.userId = users.id 
                INNER JOIN partners on user_urls.partnerId = partners.id WHERE users.isBlocked != ?`
        SQLArray.push(2)
        if(body.search){ 
            SQlquery += `AND (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? )`
            SQLArray.push('%'+body.search+'%')           
            SQLArray.push('%'+body.search+'%')           
        } 
           
        if(body.primaryContact){
            SQlquery += ' AND users.primaryContact  = ? '
            SQLArray.push(parseInt(body.primaryContact))            
        } 

        if(body.payroll){
            SQlquery += ' AND users.payroll  = ?  '
            SQLArray.push(body.payroll)           
        } 

        if(body.broker){
            SQlquery += ' AND users.brokered  = ? '
            SQLArray.push(body.broker)           
        } 

        if(body.active){
            SQlquery += ' AND users.isBlocked  = ? '
            SQLArray.push(parseInt(body.active))          
        } 

        if(body.contactType){
            SQlquery += ' AND users.contactType  = ? '
            SQLArray.push(body.contactType)          
        } 

        if(body.partnerId){
            SQlquery += ' AND users.partnerId  = ? '
            SQLArray.push(body.partnerId)          
        } 

        if(userType == 'Admin'){
            SQlquery += ' AND users.userId  = ? '
            SQLArray.push(userId)    
        }

        // To get total Records count
        const [result]  = await conn.execute(SQlquery,SQLArray);

        SQlquery += ` ORDER BY createdDate limit ${limit} OFFSET ${offset}`;

        console.log(" -- SQLArray --")
        console.log(SQLArray)
        console.log(" -- SQlquery --")
        console.log(SQlquery)

        const [rows]  =  await conn.execute(SQlquery,SQLArray) ;      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,
                    status:0
                };
        } else {            
            // console.log(rows)
            var newUserInfo = [];
        
            for (let i = 0; i < rows.length; i++) {                 
                const [result2]  =  await conn.execute('SELECT id,firstName,lastName,email,role FROM users WHERE id = ?',[rows[i].userId]);                
                newUserInfo = rows
                if(result2.length > 0){
                    // newUserInfo[i].addedBy = result2[0]  
                } else {
                    // newUserInfo[i].addedBy = {}  
                }
                          
               
                const [result_partner]  =  await conn.execute('SELECT * FROM partners WHERE id = ?',[rows[i].partnerId]);
                if(result_partner.length > 0){
                    newUserInfo[i].partner = result_partner[0]  
                } else {
                    newUserInfo[i].partner = {}  
                } 
                // newUserInfo[i].partner = result_partner[0] 

            }
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,               
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


module.exports.getAllPartner = async (body,userId,userType) => {   
    try {
        // console.log(userId , "userId")
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput;

        // for filter purpose
        var SQLArray = []
        // SQlqueryold = `SELECT users.id,users.userId,users.partnerId,users.firstName,
        //             users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,
        //             users.createdDate,users.updatedDate FROM users WHERE isBlocked != ? `;
                    
        // SQlquery_new = `SELECT users.id,users.userId,users.partnerId,users.firstName,
        // users.lastName,users.email,users.role,users.isBlocked,users.isDeleted,
        // users.createdDate,users.updatedDate FROM users WHERE isBlocked != ? `;

        SQlquery = `SELECT users.id,users.userId,users.partnerId,users.firstName, users.lastName,users.email,
                users.role,users.contactType,users.manager,
                users.primaryContact,users.isBlocked,users.isDeleted,users.createdDate,users.updatedDate
                FROM user_urls 
                INNER JOIN users on user_urls.userId = users.id 
                INNER JOIN partners on user_urls.partnerId = partners.id WHERE users.isBlocked != ?`
        SQLArray.push(2)
        if(body.search){ 
            SQlquery += ` AND (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? )`
            SQLArray.push('%'+body.search+'%')           
            SQLArray.push('%'+body.search+'%')           
        } 
           
        if(body.primaryContact){
            SQlquery += ' AND users.primaryContact  = ? '
            SQLArray.push(parseInt(body.primaryContact))            
        } 

        if(body.payroll){
            SQlquery += ' AND users.payroll  = ?  '
            SQLArray.push(body.payroll)           
        } 

        if(body.broker){
            SQlquery += ' AND users.brokered  = ? '
            SQLArray.push(body.broker)           
        } 

        if(body.active){
            SQlquery += ' AND users.isBlocked  = ? '
            SQLArray.push(parseInt(body.active))          
        } 

        if(body.contactType){
            SQlquery += ' AND users.contactType  = ? '
            SQLArray.push(body.contactType)          
        } 

        if(body.partnerId){
            SQlquery += ' AND users.partnerId  = ? '
            SQLArray.push(body.partnerId)          
        } 

        if(userType == 'Admin'){
            SQlquery += ' AND users.userId  = ? '
            SQLArray.push(userId)    
        }

        // To get total Records count
        const [result]  = await conn.execute(SQlquery,SQLArray);

        SQlquery += ` ORDER BY createdDate limit ${limit} OFFSET ${offset}`;

        // console.log(" -- SQLArray --")
        // console.log(SQLArray)
        // console.log(" -- SQlquery --")
        // console.log(SQlquery)

        const [rows]  =  await conn.execute(SQlquery,SQLArray) ;      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.NO_RECORD,
                    status:0
                };
        } else {   
            conn.release();         
            // console.log(rows)
            var newUserInfo = [];
        
            for (let i = 0; i < rows.length; i++) {                 
                const [result2]  =  await conn.execute('SELECT id,firstName,lastName,email,role FROM users WHERE id = ?',[rows[i].userId]);                
                newUserInfo = rows
                if(result2.length > 0){
                    conn.release();
                    // newUserInfo[i].addedBy = result2[0]  
                } else {
                    conn.release();
                    // newUserInfo[i].addedBy = {}  
                }
                          
               
                const [result_partner]  =  await conn.execute('SELECT * FROM partners WHERE id = ?',[rows[i].partnerId]);
                if(result_partner.length > 0){
                    newUserInfo[i].partner = result_partner[0]  
                    conn.release();
                } else {
                    conn.release();
                    newUserInfo[i].partner = {}  
                } 
                
                conn.release();
            }
            conn.release();
            return {              
                status: 1,
                message: ERROR_MSG.SUCCESS,               
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

module.exports.updateUser = async (req) => {
    try {
        var conn = await connection.getConnection();  
        
        let userId = req.userId
        delete req.userId;       
       
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
        if (rows.length ==  0) { 
            conn.release();
            return {
                message: ERROR_MSG.NO_RECORD,     
                status: 0
            };
        } 

        const result    = await commonModel.updateData('users',userId, req);
        const rowsData  = await commonModel.getUserByUid(userId);      
        conn.release(); 
        return {    
            message: ERROR_MSG.PROFILE_UPDATE,   
            status:1                         
        }; 
        
    } catch (error) {
        conn.release();
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.updatePartner = async (req) => {
    try {
        var conn = await connection.getConnection();  
        
        let partnerId = req.partnerId
        delete req.partnerId;       
       
        const [rows]  =  await conn.execute('SELECT id FROM partners WHERE id = ? AND isDeleted = ? ',[partnerId,0]);      
        if (rows.length == 0) { 
            conn.release();
            return {
                message: ERROR_MSG.NO_RECORD,     
                status: 0
            };
        } 

        // Check partner name already exists or not
        if(req.clientName){
            const [rows]  =  await conn.execute('SELECT id FROM partners WHERE clientName = ? AND isDeleted = ? AND id != ?',[req.clientName,0,partnerId]);      
            if (rows.length > 0) { 
                conn.release();
                return {
                    message: ERROR_MSG.PARTNER_ALREADY,     
                    status: 0
                };
            } 

        }
        
        await commonModel.updateData('partners',partnerId, req);
        await commonModel.getAdminByUid(partnerId);   
        conn.release();
        const [checkUsers]  =  await conn.execute('SELECT id FROM users WHERE partnerId = ? AND isDeleted = ? ',[partnerId,0]);      
        if (checkUsers.length > 0) { 
            conn.release();
            let updateUserData = {}
            if(req.brokered) {
                updateUserData.brokered  = req.brokered
            }
            if(req.payroll) {
                updateUserData.payroll  = req.payroll
            }
            await commonModel.updatePartnerData('users',partnerId, updateUserData);
            conn.release();
        }
        conn.release(); 
        return {    
            message: ERROR_MSG.PROFILE_UPDATE,   
            status:1          
        };
        
    } catch (error) {
        conn.release();
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.deleteUser = async (userId) => {
    try {     
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
        if (rows.length ==  0) { 
            conn.release();
             return {
                 message: ERROR_MSG.NO_RECORD,     
                 status: 0
             };         
        }
        
       const result = await conn.execute(`DELETE from users WHERE id = ? `, [userId]);
       conn.release();
       return {
            message: ERROR_MSG.SUCCESS,     
            status: 1
        };   

    } catch (error) {       
        conn.release();
    }
}

module.exports.changeBlockStatus = async (isBlock, userId) => {
    try {
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,'Normal']);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.ADMIN_NOT_EXISTS,   
                    status: 0
                };
        }  
        //if user type is 1 and is_block=1
        if ( isBlock == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.BLOCK,                             
                };
            }
        }
        else if ( isBlock == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.UNBLOCK,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.changePrimaryContactStatus = async (isPrimary, userId) => {
    try {
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,'Normal']);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.ADMIN_NOT_EXISTS,   
                    status: 0
                };
        }  

        if ( isPrimary == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET primaryContact = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                             
                };
            }
        }
        else if ( isPrimary == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET primaryContact = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.changeManagerStatus = async (isManager, userId) => {
    try {
        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,'Normal']);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.ADMIN_NOT_EXISTS,   
                    status: 0
                };
        }  

        if ( isManager == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET manager = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                             
                };
            }
        }
        else if ( isManager == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET manager = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}





module.exports.getClient = async (body) => {   
    try {

        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();  
        var SQlquery,SQLInput,SQLCount;
       
        if(body.search){
            SQlquery = `SELECT id,userId,clientName,email,role,brokered,payroll,mailSent,siteAccess,isBlocked,isDeleted,firstTimeLogin,invitation,invitationExpire FROM users WHERE (clientName LIKE ? OR email LIKE ? ) AND role = ?  ORDER BY createdDate DESC limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%',"Normal"]
            SQLCount = await conn.execute(SQlquery,SQLInput);
        } else {
            SQlquery = `SELECT * FROM users WHERE role = ?  order by createdDate DESC limit ${limit} OFFSET ${offset}`
            SQLInput = ["Normal"]
            SQLCount = await conn.execute(`SELECT id FROM users`,SQLInput);
        }

        const [rows]  =  await conn.execute(SQlquery,SQLInput) ;     
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Users exists.",
                    status:0
                };
        } else {

            const [result]  =  SQLCount
            var newUserInfo = [];
        
            for (let i = 0; i < rows.length; i++) {                 
                const [result]  =  await conn.execute('SELECT * FROM user_urls WHERE userId = ?',
                [rows[i].id]);                
                newUserInfo = rows
                newUserInfo[i].urls = result  
            }
            conn.release();
            return {              
                status: 1,
                message:"success",
                data: newUserInfo ,
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

module.exports.blockUnblockClient = async (isBlock, userId) => {
    try {
       var  conn = await connection.getConnection();
       const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
       if (rows.length  == 0) {
           conn.release();
           return {
                   message: "User does not exists.",
                   status: 0
               };
       }  

        //if user type is 1 and is_block=1
        if ( isBlock == 1) {
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Blocked Successfully"                               
                };
            }
        }
        else if ( isBlock == 0) {
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Unblocked Successfully"                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.deleteClient = async (userId) => {
    try {     
       var  conn = await connection.getConnection();
       //    const result = await conn.execute(`UPDATE users SET isDeleted = 1 WHERE id=? `, [userId]);
       const result = await conn.execute(`DELETE from users WHERE id = ? `, [userId]);
       await conn.execute(`DELETE from user_urls  WHERE userId = ? `, [userId]);
       conn.release();
       return true;      

    } catch (error) {
        conn.release();
    }
}

module.exports.blockSiteAccess = async (body) => {   
    try {     
        const status = Number(body.status) // calculate offset   
        const userId = body.userId 
        var conn = await connection.getConnection();  
        await conn.execute(`UPDATE users SET siteAccess = ? WHERE id = ? `,[status,userId]); 
        conn.release();
        return {              
            status: 1,
            message:"success"         
        };
       
    } catch (error) {
        conn.release();
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.resendClientInvitation = async (userId) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT * FROM users WHERE id = ? ',[userId]); 
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Users exists.",
                    status:0
                };
        }
        const password = generatePassword();  
        const Hashpassword = await bcrypt.hash(password, 12);  
        const days = 30
        const invitationExpire =  Date.now() + days*24*60*60*1000;          
       
        let payloadData = {}   
        let PdfFilepath = {}  
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        const subject = "Liberty Mutual - Resend Invitation";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to = rows[0].email;     
        payloadData.password = password
        payloadData.logo = BaseURL+'/liberty_logo_second.png' 
        payloadData.email = rows[0].email;
        payloadData.web_url = "https://www.lmpartnerportal.com"
       
        const message = await template.signupTemplate(payloadData)
        const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
        // console.log("--- mailRes ----")
        // console.log(mailRes)
        if( mailRes.accepted != undefined){
            await conn.execute('UPDATE users SET mailSent = ?, pwd = ? ,password = ? , invitationExpire = ?, invitation = ? WHERE id = ?',
            [1,password,Hashpassword,invitationExpire,0, rows[0].id]);
            conn.release(); 
            conn.release();              
        }  
        conn.release(); 
        return {    
            message:'Invitation resend successfully.'  ,
            loggedin:1                  
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.updateAnyUser = async (req) => {
    try {
        var conn = await connection.getConnection();  
        
        let userId = req.userId
        delete req.userId;       
       
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
        if (rows.length > 0) {          
            const result = await commonModel.updateData('users',userId, req);
            const rowsData  = await commonModel.getAdminByUid(userId);      
            conn.release(); 
            return {    
                message: ERROR_MSG.SUCCESS,   
                status:1,
                data:rowsData             
            };
        } else {           
             conn.release();
             return {
                 message: ERROR_MSG.NO_RECORD,     
                 status: 0
             };
        } 

        
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.dashboard = async (body) => {   
    try {
        var conn = await connection.getConnection();  
        
        const [result]   =  await conn.execute(`SELECT count(*) as Total_Invitation FROM users WHERE mailSent = ? AND isDeleted = ?`,[1,0]);
        const [result1]  =  await conn.execute(`SELECT count(*) as total_login FROM users WHERE firstTimeLogin = ? AND isDeleted = ?`,[1,0]);
        const [result2]  =  await conn.execute(`SELECT count(*) as never_login FROM users WHERE mailSent = ? AND firstTimeLogin = ? AND isDeleted = ?`,[1,0,0]);
        const [result3]  =  await conn.execute(`SELECT count(*) as site_access_count FROM users WHERE siteAccess = ? AND isDeleted = ?`,[1,0]); 
        const [result4]  =  await conn.execute(`SELECT count(*) as site_access_count FROM users WHERE siteAccess = ? AND isDeleted = ?`,[0,0]); 
        const [result5]  =  await conn.execute(`SELECT count(*) as total_users FROM users`);
        conn.release();
        return {              
            status: 1,
            message:"success",            
            data:{
               total_users_count: result5[0].total_users,
               total_invite_sent: result[0].Total_Invitation,
               total_login_count: result1[0].total_login,
               never_login_count: result2[0].never_login,
               site_access_count: result3[0].site_access_count,
               site_not_access_count: result4[0].site_access_count,
              
            }
                    
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



/** **********************************************************************
 *        List of Manager and NON- Manager function
**************************************************************************/
module.exports.addUserByManager = async (body,userId) => {   
    try {
        var conn = await connection.getConnection();     
        let payloadData = {            
            partnerId:body.partnerId
        }     
       
        const days = 60      
        var userData = body.users       
        let partnerId,payroll,brokered,lastInsertId;
        console.log(userData)
        const [rows]  =  await conn.execute('SELECT id,payroll,brokered FROM partners WHERE id = ? ',[payloadData.partnerId]);      
        if (rows.length ==  0) {
            conn.release();
            return {  
                status: 1,
                message: ERROR_MSG.NO_RECORD,          
            }
        } 
        conn.release();

        partnerId = rows[0].id;
        payroll   = rows[0].payroll;
        brokered  = rows[0].brokered;

        let emailData = {}   
        let PdfFilepath = {}  
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';
        const subject = "Liberty Mutual - SignUp";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';

        for(var i = 0; i < userData.length; i++){
            conn.release();
            const password = generatePassword();                 
            const hashPassword = await bcrypt.hash(password, 12);
            const [rowsUser]   =  await conn.execute('SELECT * FROM users WHERE email = ? ',[userData[i].email]);      
            if (rowsUser.length >  0) { // If user already exists in database
                conn.release();
                var dataURL = {
                    partnerId:partnerId,
                    userId:rowsUser[0].id
                }
                const [checkUser]  =  await conn.execute('SELECT id FROM user_urls WHERE partnerId = ? AND userId = ?',[partnerId,rowsUser[0].id]);  
                if (checkUser.length  ==   0) {
                    conn.release();
                    await commonModel.insertData('user_urls',dataURL);

                    // send invitation mail but without password
                    const to = userData[i].email;     
                    emailData.password = password
                    emailData.logo = BaseURL+'/liberty_logo_second.png' 
                    emailData.email = userData[i].email;
                    emailData.web_url = "https://www.lmpartnerportal.com"                    
                    const message = await template.signupTemplate(emailData)
                    // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);                   


                }   
                conn.release();            
    
            } else {
                // New user added under partner
                var dataURL = {
                    userId:userId,
                    partnerId:partnerId,
                    firstName:userData[i].firstName,
                    lastName:userData[i].lastName,
                    email:userData[i].email,
                    contactType:userData[i].contactType,
                    // manager:userData[i].manager,
                    // primaryContact:userData[i].primaryContact ,
                    password:hashPassword,
                    pwd:password,
                    siteAccess:1,
                    payroll:payroll,
                    brokered:brokered,
                    invitationExpire: Date.now() + days*24*60*60*1000, 
                }
                const result  = await commonModel.insertData('users',dataURL);
                const lastInsertId = result.insertId
                conn.release();
                var mappingData = {
                    partnerId:partnerId,
                    userId:lastInsertId
                }
                await commonModel.insertData('user_urls',mappingData);
               
                const to = userData[i].email;     
                emailData.password = password
                emailData.logo = BaseURL+'/liberty_logo_second.png' 
                emailData.email = userData[i].email;
                emailData.web_url = "https://www.lmpartnerportal.com"
                
                const message = await template.signupTemplate(emailData)
                // const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
                // if( mailRes.accepted != undefined){
                //     await conn.execute('UPDATE users SET mailSent = ? WHERE id = ?',[1,lastInsertId]);
                //     conn.release(); 
                //     conn.release();              
                // }  


            }
           
    
            conn.release(); 
        }


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

module.exports.updateUserByManager = async (req) => {
    try {
        console.log("enter updateUserByManager --------")
        var conn = await connection.getConnection();  
        
        let userId = req.userId
        delete req.userId;       
       
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? and role = ?',[userId,'Normal']);      
        if (rows.length ==  0) { 
            conn.release();
            return {
                message: ERROR_MSG.NO_RECORD,     
                status: 0
            };
        } 

        const result    = await commonModel.updateData('users',userId, req);
        const rowsData  = await commonModel.getUserByUid(userId);      
        conn.release(); 
        return {    
            message: ERROR_MSG.PROFILE_UPDATE,   
            status:1                         
        }; 
        
    } catch (error) {
        conn.release();
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getUserByManager = async (body) => {   
    try {
        console.log("--- get user by manager --")
        console.log(body)
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
                        users.firstName,users.lastName,users.email,users.primaryContact,users.contactType,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE  
                        (CONCAT( users.firstName, ' ', users.lastName )  LIKE  ? OR users.email LIKE ? )  
                        AND users.role = ? 
                        AND users.id IN (${userIds.join()})
                        ORDER BY users.createdDate DESC limit ${limit} OFFSET ${offset}`
            SQLInput = ['%'+body.search+'%','%'+body.search+'%',"Normal"]
            SQLCount = await conn.execute(SQlquery,SQLInput);
        } else {
            SQlquery = `SELECT users.id,users.userId,
                        users.firstName,users.lastName,users.email,users.primaryContact,users.contactType,users.manager,users.role,users.isBlocked,users.isDeleted,users.createdDate
                        FROM users WHERE 
                        users.role = ?  
                        AND users.id IN (${userIds.join()})
                        ORDER BY  users.createdDate DESC limit ${limit} OFFSET ${offset}`
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

module.exports.changeBlockStatusByManager = async (body) => {
    try {
     
        let isBlock =  body.isBlocked
        let userId =  body.userId

        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,'Normal']);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.USET_NOT_EXISTS,   
                    status: 0
                };
        }  
        //if user type is 1 and is_block=1
        if ( isBlock == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.BLOCK,                             
                };
            }
        }
        else if ( isBlock == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET isBlocked = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.UNBLOCK,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.changeManagerStatusByManager = async (body) => {
    try {
      
        let isManager =  body.isManager
        let userId =  body.userId

        var  conn = await connection.getConnection();
        const [rows]  =  await conn.execute('SELECT id FROM users WHERE id = ? AND role = ? ',[userId,'Normal']);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: ERROR_MSG.USET_NOT_EXISTS,   
                    status: 0
                };
        }  

        if ( isManager == 1) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET manager = ? WHERE id = ? `, [1,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                             
                };
            }
        }
        else if ( isManager == 0) {
            conn.release();
            const result = await conn.execute(`UPDATE users SET manager = ? WHERE id = ? `, [0,userId]);
            if (result[0].affectedRows) {
                conn.release();
                return {              
                    status: 1,
                    message: ERROR_MSG.SUCCESS,                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}












/** **********************************************************************
 *        List of Product and Category Related Function
**************************************************************************/

module.exports.addProduct = async (body) => {   
    try {
         
        let payloadData = { 
            name :body.name, title:body.title, 
            description:body.description, image:body.image ,pdf_path:body.pdf_path 
        }        
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM products WHERE name = ? ',[body.name]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Product already exists.",
                    loggedin: 0
                };
        } else {
    
            await conn.execute(`INSERT INTO products (name,title,description,image,pdf_path) VALUES(?,?,?,?,?)`,
            [payloadData.name,payloadData.title,payloadData.description, payloadData.image]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.getProduct = async (body) => {   
    try {
        const limit = 3 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute(`SELECT * FROM products order by name limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Product exists.",
                    status:0
                };
        } else {
            const [result]  =  await conn.execute(`SELECT * FROM products order by name`);
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

module.exports.deleteProduct = async (Id) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`DELETE FROM products WHERE id = ? `, [Id]);
       if (result[0].affectedRows) {
           return true;
       }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.getParentCategory = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM categories WHERE parent_id = ? AND isDeleted = ?',[0,0]);      
        if (rows.length  ==  0) {
            conn.release();
            return {
                    message: "No Parent Category exists.",
                    loggedin: 0
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


module.exports.addCategory = async (body) => {   
    try {
         
        let payloadData = { 
            name :body.name, description:body.description, parent_id:body.parent_id
        }
       
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM categories WHERE name = ? AND isDeleted = ? ',[body.name, false]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Category already exists.",
                    loggedin: 0
                };
        } else {
    
            await conn.execute(`INSERT INTO categories (parent_id,name,description) VALUES(?,?,?)`,
            [payloadData.parent_id,payloadData.name,payloadData.description]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.getCategory = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM categories WHERE isDeleted = 0');      
        if (rows.length  ==  0) {
            conn.release();
            return {
                    message: "No Category exists.",
                    loggedin: 0
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

module.exports.blockUnblockCategory = async (isBlock, catId) => {
    try {
        var  conn = await connection.getConnection(); 
        const [rows]  =  await conn.execute('SELECT id FROM categories WHERE id = ?',[catId]);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: "Category does not exists.",
                    status: 0
                };
        }         
        if ( isBlock == 1) {
            const result = await conn.execute(`UPDATE categories SET isBlocked = 1 WHERE id=? `, [catId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Blocked Successfully"                               
                };
            }
        }
        else if ( isBlock == 0) {
            const result = await conn.execute(`UPDATE categories SET isBlocked = 0 WHERE id=? `, [catId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Unblocked Successfully"                               
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}


/** **********************************************************************
 *        List of Videos Related Function
**************************************************************************/

module.exports.addVideo = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM videos WHERE videoPath = ? ',[body.videoPath]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Video already exists.",
                    loggedin: 0
                };
        } else {
    
            await conn.execute(`INSERT INTO videos (categoryId,thumbnail,videoPath,title,description) VALUES(?,?,?,?,?)`,
            [body.categoryId,body.thumbnail,body.videoPath,body.title,body.description]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.getVideo = async (body) => {   
    try {
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Videos exists.",
                    status:0
                };
        } else {
            const [result]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate`);
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

module.exports.deleteVideo = async (Id) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`DELETE FROM videos WHERE id = ? `, [Id]);
       if (result[0].affectedRows) {
           return true;
       }
        conn.release();

    } catch (error) {
        conn.release();
    }
}


/** **********************************************************************
 *        List of Home Program Related Function
**************************************************************************/

module.exports.addEmailTemplate = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ? ',[body.path,0]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email template already exists.",
                    loggedin: 0
                };
        } else {            
           
             await conn.execute(`INSERT INTO programs (categoryId,path,title,description) VALUES(?,?,?,?)`,
            [body.categoryId,body.path,body.title,body.description]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.addBenfitslide = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ?',[body.path,1]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email template already exists.",
                    loggedin: 0
                };
        } else {                        

            await conn.execute(`INSERT INTO programs (categoryId,path,title,description,type) VALUES(?,?,?,?,?)`,
            [body.categoryId,body.path,body.title,body.description,1]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.addWordDoc = async (body) => {   
    try {
         
        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ?',[body.path,2]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Word template already exists.",
                    loggedin: 0
                };
        } else {
            
           
            await conn.execute(`INSERT INTO programs (categoryId,path,title,description,type) VALUES(?,?,?,?,?)`,
            [body.categoryId,body.path,body.title,body.description,2]) ;
            
            conn.release();
            return {              
                status: 1,
                message:"success",
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

module.exports.deleteProgram = async (Id) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`DELETE FROM programs WHERE id = ? `, [Id]);
       if (result[0].affectedRows) {
           return true;
       }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

module.exports.blockUnblockProgram = async (isBlock, catId) => {
    try {
        var  conn = await connection.getConnection();   
        const [rows]  =  await conn.execute('SELECT id FROM programs WHERE id = ?',[catId]);      
        if (rows.length  == 0) {
            conn.release();
            return {
                    message: "Program does not exists.",
                    status: 0
                };
        }  

        if ( isBlock == 1) {
            const result = await conn.execute(`UPDATE programs SET isBlocked = 1 WHERE id=? `, [catId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Blocked Successfully"                               
                };
            }
        }
        else if ( isBlock == 0) {
            const result = await conn.execute(`UPDATE programs SET isBlocked = 0 WHERE id=? `, [catId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Unblocked Successfully"          
                };
            }
        }
        conn.release();

    } catch (error) {
        conn.release();
    }
}

/** **********************************************************************
*                  List of User Related Function
**************************************************************************/

module.exports.addUser = async (body) => {   
    try {
        var conn = await connection.getConnection();     
        let payloadData = { 
            email :body.email, firstName:body.firstName, lastName:body.lastName,
            role:body.role, phone:body.phone, payroll:body.payroll,brokered:body.brokered ,
            url:body.url
        }
     
        // const password = 'qwerty'
        // const invitationExpire = Date.now() + 3600000;
        const password = generatePassword(); 
        const days = 30
        const hashPassword = await bcrypt.hash(password, 12);
        var DataUrl =  body.url
        body.password = hashPassword;
        body.invitationExpire = Date.now() + days*24*60*60*1000; // 1 hour
        delete body.url;
        const [rows]  =  await conn.execute('SELECT * FROM users WHERE email = ? AND isDeleted = ? ',[body.email,0]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email already  exists.",
                    loggedin: 0
                };
        } else {
            
            const rows = await commonModel.insertData('users',body);
            const lastInsertId = rows.insertId;     
            
            // insert URLs
          
           
            for(var i = 0; i < DataUrl.length; i++){
                var dataURL = {
                    userId:lastInsertId,
                    clientName:DataUrl[i].clientName,
                    url:DataUrl[i].url
                }
                await commonModel.insertData('user_urls',dataURL);
            }
     

            const subject = "Liberty Mutual - SignUp";
            const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
            const to = payloadData.email;
            payloadData.logo = BaseURL+'/liberty_logo_second.png'
            // payloadData.logo = BaseURL+'/liberty_Logo_fill.jpg'
            payloadData.password = password           
            payloadData.web_url = "https://www.lmpartnerportal.com"
            const message = await template.signupTemplate(payloadData)
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

module.exports.resendOTP = async (req) => {
    try {
        var conn = await connection.getConnection();     
        var [rows] =  await conn.execute('SELECT * FROM users WHERE email = ? ',[req.email]); 
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Users exists.",
                    status:0
                };
        }
        const password = generatePassword();  
        const Hashpassword = await bcrypt.hash(password, 12);  
        const days = 30
        const invitationExpire =  Date.now() + days*24*60*60*1000;          
       
        let payloadData = {}   
        let PdfFilepath = {}  
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        const subject = "Liberty Mutual - SignUp";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to = rows[0].email;     
        payloadData.password = password
        payloadData.logo = BaseURL+'/liberty_logo_second.png' 
        payloadData.email = rows[0].email;
        payloadData.web_url = "https://www.lmpartnerportal.com"
       
        const message = await template.signupTemplate(payloadData)
        const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);

        if( mailRes.accepted != undefined){
            await conn.execute('UPDATE users SET mailSent = ?, pwd = ? ,password = ? , invitationExpire = ?, invitation = ? WHERE id = ?',
            [1,password,Hashpassword,invitationExpire, 0 , rows[0].id]);
            conn.release(); 
            conn.release();              
        }  
        conn.release(); 
        return {    
            message:'Invitation link resend successfully.'  ,
            loggedin:1                  
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.deleteAllUser = async (userId) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`DELETE from users `);
       await conn.execute(`DELETE from user_urls `);
       if (result[0].affectedRows) {
           return true;
       }
        conn.release();

    } catch (error) {
        conn.release();
    }
}


/** **********************************************************************
 *                  List of FAQ Related Function
 **************************************************************************/

module.exports.addFAQ = async (body) => {   
    try {
        
        var conn = await connection.getConnection();      
        const [rows]  =  await conn.execute('SELECT * FROM faq WHERE question = ?',[body.question]);         
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Question already  exists.",
                    status: 0
                };
        } else {    
            
            const rows = await commonModel.insertData('faq',body); 
            conn.release();
            return {              
                status: 1,
                message:"success"                                   
            };
           
        }
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.getFAQ = async (body) => {   
    try {
        const limit = 10 // page number
        const page = Number(body.page) // calculate offset
        const offset = (page - 1) * limit

        var conn = await connection.getConnection();   
        const [rows]  =  await conn.execute(`SELECT faq.id as Id, faq.question, faq.answer,categories.id as category_id, categories.name as categoryName  FROM categories INNER JOIN faq on categories.id = faq.categoryId  WHERE categories.type = 1  limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No FAQ exists.",
                    status:0
                };
        } else {
            const [rows1]  = await conn.execute(`SELECT categories.id as category_id, categories.name as category_name , faq.question, faq.answer FROM categories INNER JOIN faq on categories.id = faq.categoryId WHERE categories.type = 1`);
           
            conn.release();
            return {              
                status: 1,
                message:"success",
                data: rows ,
                totalRecords:rows1.length,
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

module.exports.deleteFAQ = async (Id) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`DELETE FROM faq WHERE id = ? `, [Id]);
       if (result[0].affectedRows) {
           return true;
       }
        conn.release();

    } catch (error) {
        conn.release();
    }
}




// Upload Excel User
module.exports.uploadUserExcel_old =  async (req, res) => {
    try {  

        var conn = await connection.getConnection();     
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;		 
        var checkFileError =  false;

      
        // if (!req.file.mimetype.includes("xlsx") || !req.file.mimetype.includes("excel") || !req.file.mimetype.includes("spreadsheetml")) {
        //     var response  = {
        //         statusCode:200,
        //         message:'Please upload an excel file only.'
        //     }
        //     fs.unlinkSync(Filepath);
        //     return response;
        // } 

        if (req.file == undefined) {
           
            // return res.status(400).send("Please upload an excel file!");
            var response  = {
                statusCode:200,
                message:'Please upload an excel file'
            }
            fs.unlinkSync(Filepath);
            return response;
        }

        

        await readXlsxFile(Filepath).then((rows) => {     
                  
            if(rows[0][0] !== 'firstName' || rows[0][1] !== 'lastName' || rows[0][2] !== 'Email' || rows[0][3] !== 'Phone') {               
                checkFileError =  false;                        
            }
        })

        if(checkFileError == false){
           
            await readXlsxFile(Filepath).then((rows) => {     
                           
                rows.shift();      
                rows.forEach(async (row) => {
                    
                  let tutorial = {
                    firstName: row[0],
                    lastName: row[1],
                    email: row[2],
                    phone: row[3],
                    role: row[4]            
                   
                  };
                  var urlType = row[5] 
                 
                  var inputURL = row[6] 
              
                  var string;

                if(urlType  == "Single"){

                }

                if(urlType  == "Multiple"){

                    var DataUrl = JSON.parse(inputURL);


                   
                    for(var i = 0; i < DataUrl.length; i++){
                        
                       
                        var  client_name = DataUrl[i].clientName
                        var  client_url  = DataUrl[i].url

                        var dataURL = {
                            userId:75,
                            clientName:client_name,
                            url:client_url
                        }
                       
                        await commonModel.insertData('user_urls',dataURL);
                        
                    }

                    /*
                    var DataUrl = inputURL.split(";")
                    for(var i = 0; i < DataUrl.length; i++){
                        console.log(" i = "+DataUrl[i])
    
                        string = DataUrl[i]
                        var client_url =  string.substring(string.indexOf('-') + 1)
                        // var be_url =  string.substring(string.lastIndexOf('-')+1)
    
                        var client_name = string.substr(0, string.indexOf('-'));
    
                        console.log(" client Name "+client_name)
                        console.log(" Client URL "+client_url)
                        var dataURL = {
                            userId:75,
                            clientName:client_name,
                            url:client_url
                        }
                       
                        await commonModel.insertData('user_urls',dataURL);
                    }
                    */
                    
                }
                

                  // Insert Into DB
                  var userResult  = await poolPromise.query('SELECT * FROM users WHERE email = ? ',[tutorial.email]);             
                  if(userResult.length == 0){
                    // await poolPromise.query("INSERT INTO users SET ? ", tutorial);  
                  }                           
                         
                  
                });
            });
           
            // Delete Uploaded file
            // console.log(Filepath)
            fs.unlinkSync(Filepath);
            return true ;
        } else {
            fs.unlinkSync(Filepath);       
            var response  = {
                statusCode:200,
                message:'Oops! Something change in excel column name'
            }
            return response;
        }
       
       
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        return err;
    }
}

// Upload Excel User
module.exports.uploadUserExcel =  async (req, res) => {
    try {  
        let PdfFilepath = {}
        var conn = await connection.getConnection();     
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;	
         
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        var checkFileError =  false;
        var bulkArray = []
        var payloadData = {}
        // const password = generatePassword();  
        // const hash_password = await  bcrypt.hash('Liberty123!', 12);    
        
        // console.log(req.file)
        // if (!req.file.mimetype.includes("xlsx") || !req.file.mimetype.includes("excel") || !req.file.mimetype.includes("spreadsheetml")) {
        //     var response  = {
        //         statusCode:200,
        //         message:'Please upload an excel file only.'
        //     }
        //     fs.unlinkSync(Filepath);
        //     return response;
        // } 

        if (req.file == undefined) {
           
            // return res.status(400).send("Please upload an excel file!");
            var response  = {
                statusCode:200,
                message:'Please upload an excel file'
            }
            fs.unlinkSync(Filepath);
            return response;
        }

        

        await readXlsxFile(Filepath).then((rows) => {     
                  
            if(rows[0][0] !== 'Client Name' || rows[0][1] !== 'Broker Status' || rows[0][2] !== 'Payroll Status' || rows[0][3] !== 'Email'  || rows[0][3] !== 'Email URL') {               
                checkFileError =  false;                        
            }
        })
        var i = 0;
        var email_string = ''
        if(checkFileError == false){
        
            await readXlsxFile(Filepath).then((rows) => {     
              
                rows.shift();      

                rows.forEach(async (row) => {
                   
                    let tutorial = {
                        clientName: row[0],
                        brokered: row[1],
                        payroll: row[2],
                        email: row[4] ,
                        email_url: row[5] ,
                        invitationExpire : Date.now() + 30*24*60*60*1000
                        // password: hash_password   
                    
                    };
                    task(i,tutorial);
                    i++
                   
                });
                function task(i,tutorial) {

                    setTimeout( async function() {
                        
                        try {
                            
                            const randomString = generatePassword();  
                            const hash_password = await  bcrypt.hash(randomString, 12);    
                            // const hash_password = await  bcrypt.hash('Liberty123!', 12);   
                            tutorial.password =  hash_password
                            // tutorial.pwd =  randomString

                            const [rowsInsert,field] = await conn.execute('SELECT * FROM users WHERE email = ? ',[tutorial.email]);             
                            if(rowsInsert.length == 0){
                               
                                const email_url = tutorial.email_url
                                delete tutorial.email_url
                                // To send Email
                               
        
                                email_string = 'nitinsehgal'+i+'@mailinator.com' 
                                const subject = "Liberty Mutual - SignUp";
                                const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
                                const to =  tutorial.email; //email_string
                                payloadData.logo = BaseURL+'/liberty_logo_second.png'                                    
                                payloadData.password = randomString           
                                payloadData.web_url = "https://www.lmpartnerportal.com"
                               
                                /* TO send Welcome Email */
                                const message = await template.signupTemplate(payloadData)
                                mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);

                                console.log(tutorial);
                                const rowsUser  =  await commonModel.insertData('users',tutorial);
                                
                                const lastInsertId = rowsUser.insertId;     
            
                               
                                var dataURL = {
                                    userId:lastInsertId,
                                    clientName:tutorial.clientName,
                                    url: email_url
                                }    
                                // console.log(dataURL)                   
                                await commonModel.insertData('user_urls',dataURL);
                                conn.release();
                            
                                // const [rows,field]  =  await commonModel.insertData('users',tutorial);

                                
                              
                            
                            }   else {
                                // var dataURL = {
                                //     userId:rowsInsert.id,
                                //     clientName:tutorial.clientName,
                                //     url: email_url
                                // }    
                                // console.log(dataURL)                   
                                // await commonModel.insertData('user_urls',dataURL);
                                conn.release();                               
                                console.log("no insertion happen "+ tutorial.email)
                            }                       
                            
                        }
                        catch (error) {
                            if (!error.statusCode) {
                                error.statusCode = 500
                            }
                            return error;
                        }
                        console.log("--- beofor wait is called ---------")

                    }, 9000 * i);
                  }
            });

            console.log("--- out side loop ----"+i)
            console.log(bulkArray)
            if(bulkArray.length){
                console.log("bulkArray happen")
                console.log(bulkArray)
            }
            conn.release();
            // Delete Uploaded file
            // console.log(Filepath)
            fs.unlinkSync(Filepath);
            return true ;
        } else {
            fs.unlinkSync(Filepath);       
            var response  = {
                statusCode:200,
                message:'Oops! Something change in excel column name'
            }
            return response;
        }
       
       
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        return err;
    }
}



module.exports.uploadPDF =  async (req, res) => {
    AWS.config.update({
        "accessKeyId": process.env.S3_ACCESS_KEY,
        "secretAccessKey": process.env.S3_SECRET_KEY,
        "folder": {
            "ProfilePics": "ProfilePics"
        }
    });
    var s3 = new AWS.S3();
    try {  
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;		 
        var checkFileError =  false;
        // console.log(req.file)
        // if (!req.file.mimetype.includes("pdf")) {
        //     var response  = {
        //         statusCode:200,
        //         message:'Please upload an image and pdf file only'
        //     }
        //     fs.unlinkSync(Filepath);
        //     return response;
        // } 

        if (req.file == undefined) {
            var response  = {
                statusCode:200,
                message:'Please upload an image and pdf file'
            }
            fs.unlinkSync(Filepath);
            return response;
        }

        const params = {			
			Bucket: 'nitin2009',		
			Key: 'WebImages/'+req.file.filename,
			ACL: 'public-read',
			Body: fs.createReadStream(Filepath),
			// ContentType: 'image/jpg'
			// ContentType: 'application/pdf'
			// ContentType: 'application/vnd.ms-outlook'
            // ContentType: 'video/mp4'
        };
        
        // upload to S3 Bucket
        const data = await s3.upload(params).promise();
        // console.log("stored: ");
        // console.log(data);
        let payloadData = {
            pdf_path : data.Location
        }
        var  conn = await connection.getConnection();
        const rows = await commonModel.insertData('pdf',payloadData);
        conn.release();
        fs.unlinkSync(Filepath);
        var response  = {
            statusCode:200,
            message:'PDF uploaded succesfully',
            data: data.Location
        }
        return response;      
       
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        return err;
    }
}


module.exports.uploadUserBulk_old =  async (req, res) => {
    try {  
        let PdfFilepath = {}
        var conn = await connection.getConnection();     
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;	         
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        var checkFileError =  false;
        var bulkArray = []
        var payloadData = {}
       
        if (req.file == undefined) {           
            // return res.status(400).send("Please upload an excel file!");
            var response  = {
                statusCode:200,
                message:'Please upload an excel file'
            }
            fs.unlinkSync(Filepath);
            return response;
        }

        

        await readXlsxFile(Filepath).then((rows) => {     
                  
            if(rows[0][0] !== 'Client Name' || rows[0][1] !== 'Broker Status' || rows[0][2] !== 'Payroll Status' || rows[0][3] !== 'Email'  || rows[0][3] !== 'Email URL') {               
                checkFileError =  false;                        
            }
        })
        var i = 0;
        var email_string = ''
        if(checkFileError == false){
        
            await readXlsxFile(Filepath).then( async (rows) => {     
              
                rows.shift();      
                console.log("--- etner in row shift ")
                const updatePromises = [];
                rows.forEach(async (row) => {
                    console.log("--- etner in row shift "+row)
                    const randomString = generatePassword();  
                    const hash_password = await  bcrypt.hash(randomString, 12);  
                    let tutorial = {
                        clientName: row[0],
                        brokered: row[1],
                        payroll: row[2],
                        email: row[4] ,
                        email_url: row[5] ,
                        invitationExpire : Date.now() + 30*24*60*60*1000,
                        password: hash_password,                      
                        pwd:randomString,
                        PdfFilepath:PdfFilepath
                    
                    };
                    // console.log("***************** tutorial Before ******************")
                    // console.log(tutorial);
                   
                    var patientQueryData  = tutorial
                  
                    await sendMailToUser(patientQueryData,conn).then(async data => {    
                        console.log(data," respne back+++++++++++++++++++")                    
                        updatePromises.push(data);
                    })                   

                    i++
                   
                });
                console.log(updatePromises,"update pormose array")
                let finalResponse = await Promise.all(updatePromises).then((res) => {
                    console.log("======== Enter Promise ALL ++++++++++++++++")
                    return res;              
                });
                if (finalResponse.length > 0) {     
                    console.log("++++++++++ Ener in final response ++++++++++")            
                    conn.release();
                    return {              
                        status: 1,
                        message:"success"  
                    };        
                } 
    
               
            });

            console.log("--- out side loop ----"+i)  
           

            conn.release();            
            fs.unlinkSync(Filepath);
          
           
            // return true ;
        } else {
            fs.unlinkSync(Filepath);       
            var response  = {
                statusCode:200,
                message:'Oops! Something change in excel column name'
            }
            return response;
        }
       
       
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        return err;
    }
}



module.exports.readJson = async (req,res) => {
    let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;	
    let rawdata = fs.readFileSync(Filepath);
    let punishments = JSON.parse(rawdata);
    // console.log("NAME "+punishments.WB.name);
    // console.log("NO"+punishments.WB.no)
   
    let inputData = []
    inputData.push(punishments['AP'].no)
    let stateName = punishments['AP'].name
    console.log(inputData);
    // console.log(stateName);
    var i = 1
    for (const [key, value] of Object.entries(inputData[0])) {
        console.log(key+" ++++ "+value+" i = "+i);
         let tutorial = {
            cityCode: key,
            cityName: value,
            state: stateName  
        };
        console.log(tutorial)

        var  conn = await connection.getConnection();
        const rows = await commonModel.insertData('rto',tutorial);
        conn.release();

        i++
    }

    
    inputData.forEach(async (row,index) => {
        // console.log(row[5]+" ++++ "+index);
        // console.log("NO"+punishments.WB.no)      
        // let tutorial = {
        //     clientName: row[0],
        //     brokered: row[1],
        //     payroll: row[2],
        //     email: row[4] ,
        //     email_url: row[5] ,
        //     invitationExpire : Date.now() + 30*24*60*60*1000
        //     // password: hash_password   
        
        // };
        // task(i,tutorial);
        i++
       
    });

    return true ;
}

module.exports.testMail = async (body) => {   
    try {
       
        console.log("--- Enter in tests maild=======")
        let payloadData = {

        }

        const subject = "Liberty Mutual - SignUp";
        const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to = 'nitin.shegal@mobileprogramming.com';
        payloadData.logo = BaseURL+'/liberty_logo_second.png'
        // payloadData.logo = BaseURL+'/liberty_Logo_fill.jpg'
        payloadData.password = 'qwerty'           
        payloadData.web_url = "https://www.lmpartnerportal.com"
        // const message = await template.signupTemplate(payloadData)
        const message = 'TEst'
        console.log("--- Enter in tests fierst =======")
        const mailResponse = mail.mailfunction(from, to, subject, message);
        // const mailResponse2 = mail.mailfunctionSecond(from, to, 'second', message);
        return {
            message: "success.",
            status:1,
            data:mailResponse
        };
      
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}

module.exports.updateInvitationUser = async (body) => {   
    try {     
        const status = Number(body.status) // calculate offset   
        const type = body.type 
        var conn = await connection.getConnection();  
        // console.log(status+" -- "+type)
        if(type == 'firstTimeLogin'){
            await conn.execute(`UPDATE users SET firstTimeLogin = ? WHERE 1 `,[status]); 
        }
       
        if(type == 'invitation'){
            await conn.execute(`UPDATE users SET invitation = ? WHERE 1 `,[status]); 
        }

        if(type == 'invitationExpire'){
            const invt = Date.now() + 30*24*60*60*1000     
            console.log(invt)       
            await conn.execute(`UPDATE users SET invitationExpire = ? WHERE invitationExpire <= ?  AND firstTimeLogin = ?`,[invt,Date.now(),0]); 
            // await conn.execute(`UPDATE users SET invitationExpire = ? , invitation = ? WHERE 1 `,[invt,0]); 
        }

        if(type == 'passwrord'){
            await conn.execute(`UPDATE users SET pwd = ? WHERE 1 `,['']); 
        }

        if(type == 'mailSent'){
            await conn.execute(`UPDATE users SET mailSent = ? WHERE 1 `,[status]); 
        }


        conn.release();
        return {              
            status: 1,
            message:"success"         
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}



module.exports.sendInvitationUser = async (param,body) => {   
    try {
       //UPDATE `users` SET `pwd`='',`password`='' WHERE 1
        var rows, rows1;  
        const limit = 5 // page number
        const page = 1 // calculate offset
        const offset = (page - 1) * limit
        var conn = await connection.getConnection();        
        rows1 =  await conn.execute(`SELECT * FROM users WHERE mailSent = ? AND siteAccess = ? limit ${limit} OFFSET ${offset}`,[0,1]);  
        console.log(`SELECT * FROM users limit ${limit} OFFSET ${offset}`)
        console.log(rows1.length)
        // return true
        let PdfFilepath = {}    
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        if (rows1[0].length == 0) {
            conn.release();
            return {
                    message: "No USers exists.",
                    status:0
                };
        } else {      
          
            var patientQueryData  = rows1[0]
            const updatePromises = [];
            for (const key in Object.keys(patientQueryData)) {               
                // console.log(patientQueryData[key])
                await updateMailStatus(patientQueryData[key],conn,PdfFilepath).then(async data => {
                    let temp = patientQueryData[key];
                    temp.thumbnail = data;
                    updatePromises.push(temp);
                })
            }  
            let finalResponse = await Promise.all(updatePromises).then((res) => {
                console.log("--- final resopnse in promise all -----------------------------")
                // console.log(res)
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

// Working for new user upload
module.exports.uploadUserBulk =  async (req, res) => {
    try {  
        let PdfFilepath = {}
        var conn = await connection.getConnection();  
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;	         
        PdfFilepath.path     =  path.join(__dirname, '../../../images/LibertyMutualPartnerPortalOverview.pdf');			 
        PdfFilepath.filename = 'Liberty Mutual Partner Portal Overview.pdf';

        var checkFileError =  false;        
        if (req.file == undefined) {  
            var response  = {
                statusCode:200,
                message:'Please upload an excel file'
            }
            fs.unlinkSync(Filepath);
            return response;
        }

        var i = 0;      
     
        readXlsxFile(Filepath).then( async (rows) => {     
            
            rows.shift();      
            console.log("--- etner in row shift ")
           
            const updatePromises = [];
            rows.forEach(async (row) => {
               
                // const randomString = generatePassword();  
                // const hash_password = await  bcrypt.hash(randomString, 12);  
                if(row[4]  != null && row[4] != ''){
                    let tutorial = {                       
                        clientName  : row[1],
                        brokered    : row[2],
                        payroll     : row[3] != '' ? row[3] : 'No',
                        email       : row[4],
                        siteAccess  : row[5] == 'Yes' ? 1 : 0,
                        email_url   : row[6],                      
                        invitationExpire : Date.now() + 30*24*60*60*1000,
                        // password: hash_password,                      
                        // pwd:randomString,
                        PdfFilepath:PdfFilepath
                    
                    };
                    // console.log("***************** tutorial Before ******************")
                    // console.log(tutorial);
                    updatePromises.push(tutorial);
                    // var patientQueryData  = tutorial
                    
                    // await insertUserToDB(patientQueryData,conn).then(async data => {    
                    //     console.log(data," respne back+++++++++++++++++++")                    
                    //     updatePromises.push(data);
                    // })                   
    
                    i++
                }
                
                
            });


            // console.log(updatePromises,"update pormose array")
            var patientQueryData  = updatePromises
            const newPromises = [];
            for (const key in Object.keys(patientQueryData)) {               
                // console.log(patientQueryData[key])
                await insertUserToDB(patientQueryData[key],conn).then(async data => {    
                    console.log(data," respne back+++++++++++++++++++")                    
                    newPromises.push(data);
                })                   
    
            }  
            let finalResponse = await Promise.all(newPromises).then((res) => {
                return res;              
            });

            if (finalResponse.length > 0) {                 
                conn.release();
                return {              
                    status: 1,
                    message:"success",                    
                    data: finalResponse                  
                };

            }   
            // let finalResponse = await Promise.all(updatePromises).then((res) => {
            //     console.log("======== Enter Promise ALL ++++++++++++++++")
            //     return res;              
            // });
            // if (finalResponse.length > 0) {     
            //     console.log("++++++++++ Ener in final response ++++++++++")            
            //     conn.release();
            //     return {              
            //         status: 1,
            //         message:"success"  
            //     };        
            // } 

            
        });

        console.log("--- out side loop ----"+i)  
        

        conn.release();            
        fs.unlinkSync(Filepath);         
           
       // return true ;        
       
       
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        return err;
    }
}

module.exports.updateSiteAccess = async (body) => {   
    try {     
        const status = Number(body.status) // calculate offset   
        const userId = body.userId 
        var conn = await connection.getConnection();  
        await conn.execute(`UPDATE users SET siteAccess = ? WHERE id = ? `,[status,userId]); 
        conn.release();
        return {              
            status: 1,
            message:"success"         
        };
       
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        return error;
    }
}


/** method for random genrate password */
function generatePassword() {
    const Crypto = require('crypto')
    return Crypto
            .randomBytes(5)
            .toString('base64')
            .slice(0, 5)+"@"
}



async function sendMailToUserOLD(tutorial,conn){
    console.log("*************tutorial sendMailToUser *********************");
    console.log(tutorial);
    let payloadData = {}
    // var conn = await connection.getConnection(); 
    return new Promise( async (resolve,reject) => {
        // console.log("----------- enter --------")
       
        const [rowsInsert,field] = await conn.execute('SELECT * FROM users WHERE email = ? ',[tutorial.email]);             
        if(rowsInsert.length == 0){
            conn.release();  
            console.log("----------- enter Insert DATA --------")
            const email_url = tutorial.email_url
            delete tutorial.email_url
            // To send Email
           
            // console.log(tutorial)
            // email_string = 'nitinsehgal'+i+'@mailinator.com' 
            const subject = "Liberty Mutual - SignUp";
            const from = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
            const to =  tutorial.email; //email_string
            // console.log("----------- enter 33--------")
            payloadData.logo = BaseURL+'/liberty_logo_second.png'   
            // console.log("----------- enter 44--------")                                 
            payloadData.password = tutorial.pwd           
            payloadData.web_url = "https://www.lmpartnerportal.com"
           
            // console.log(payloadData)
            /* TO send Welcome Email */
            new Promise( async (resolve,reject) => {

            })
            const message = await template.signupTemplate(payloadData)
            const mailRes = mail.mailfunctionWithAttachment(from, to, subject, message,tutorial.PdfFilepath);
            console.log("++++++++++++++++ MAIL RESPONSE ++++++++++++++++++")  
            console.log(mailRes)
            delete tutorial.PdfFilepath
            // delete tutorial.pwd
            const rowsUser  =  await commonModel.insertData('users',tutorial);            
            const lastInsertId = rowsUser.insertId;  
           
            var dataURL = {
                userId:lastInsertId,
                clientName:tutorial.clientName,
                url: email_url
            }              
            await commonModel.insertData('user_urls',dataURL);
            conn.release();     
            if(mailRes.accepted.length > 0){
                resolve(lastInsertId);    
            }   
                  
        
        }   else {           
            conn.release();                               
            console.log("no insertion happen "+ tutorial.email)
        }      
       
    })
    
}

async function insertUserToDB(tutorial,conn){
    const randomString = generatePassword();  
    const hash_password = await  bcrypt.hash(randomString, 12);
    tutorial.password = hash_password
    tutorial.pwd = randomString
    // var conn = await connection.getConnection(); 
    return new Promise( async (resolve,reject) => {
        console.log("*************tutorial insertUserToDB *********************");
        console.log(tutorial);
       
        const [rowsInsert,field] = await conn.execute('SELECT * FROM users WHERE email = ? ',[tutorial.email]);             
        if(rowsInsert.length == 0){
            conn.release();  
            console.log("----------- enter Insert DATA --------")
            const email_url = tutorial.email_url
            delete tutorial.email_url
            delete tutorial.PdfFilepath
            // delete tutorial.pwd
           
            conn.release();    
            const rowsUser  =  await commonModel.insertData('users',tutorial);            
            const lastInsertId = rowsUser.insertId;            
            
            conn.release();    
            
            if(lastInsertId){
                var dataURL = {
                    userId:lastInsertId,
                    clientName:tutorial.clientName,
                    siteAccess:tutorial.siteAccess,
                    url: email_url ? email_url : ''
                }              
                await commonModel.insertData('user_urls',dataURL);
                resolve(lastInsertId);    
            } 
           
                  
        
        }   else {           
            conn.release();                               
            // console.log("**************** No insertion happen **************"+ tutorial.email)
            const [rowsURL,field] = await conn.execute('SELECT * FROM user_urls WHERE userId = ? AND clientName = ? AND url =?'
            ,[rowsInsert[0].id,tutorial.clientName,tutorial.email_url]);  
            if(rowsURL.length == 0){
                console.log("**************** URL insertion happen **************"+ tutorial.email+" == "+rowsInsert[0].id)
                var dataURL = {
                    userId:rowsInsert[0].id,
                    clientName:tutorial.clientName,
                    siteAccess:tutorial.siteAccess,
                    url: tutorial.email_url ? tutorial.email_url : ''
                }              
                await commonModel.insertData('user_urls',dataURL);
                conn.release();   
                resolve(-1);   
            } else {
                conn.release();   
                console.log("**************** NO URL insertion happen **************"+ tutorial.email+" == "+rowsInsert[0].id)
                resolve(-1);   
            }          
            
             
        }      
       
    })
    
}


async function updateMailStatus(tutorial,conn,PdfFilepath){
    console.log("*************tutorial updateMailStatus  *********************");
    console.log(tutorial);
    let payloadData = {}
    const randomString = generatePassword();  
    const hash_password = await  bcrypt.hash(randomString, 12); 
    return new Promise( async (resolve,reject) => {
       
        console.log("----------- UPDATE USER DATA -------- "+tutorial.id)       
        // To send Email     
        
        const subject = "Liberty Mutual - SignUp";
        const from    = 'Liberty Mutual<lmpartnerportal@libertymutualinsurance.awsapps.com>';
        const to      =  tutorial.email; //email_string          
        payloadData.logo = BaseURL+'/liberty_logo_second.png' 
        payloadData.password = randomString           
        // payloadData.password = tutorial.pwd           
        payloadData.web_url = "https://www.lmpartnerportal.com"           
        const message = await template.signupTemplate(payloadData)
        const mailRes = await mail.mailfunctionWithAttachment(from, to, subject, message,PdfFilepath);
        console.log("++++++++++++++++ MAIL RESPONSE ++++++++++++++++++")  
        // console.log(mailRes)
        console.log(mailRes.accepted)
        // mailRes.accepted = undefined
        conn.release(); 
        conn.release();     
        if( mailRes.accepted != undefined){
            await conn.execute(`UPDATE users SET mailSent = ?, pwd = ? , password = ?  WHERE id = ? `,
             [1,randomString,hash_password,tutorial.id]);
            conn.release(); 
            conn.release(); 
            resolve(1);    
        }  else {
            conn.release(); 
            resolve(1); 
        }     
       
    })
    
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



module.exports.encryptData = async (data) => {
    try {   
        console.log("-- input data  --")
        console.log(data)
        var result  =  encryptApi(data)
        console.log("-- result  data  --")
        console.log(result)
        return {
            message: ERROR_MSG.SUCCESS,     
            status: 1,
            data: result,
            decrypt:decryptApi(result)
        };
       

    } catch (error) {
        // conn.release();
    }
}

let decryptApi = (requestData) => {
    let bytes = CryptoJS.AES.decrypt(requestData.replace(/\./g, '/').replace(/,/g, '+'), 'qwerty');
	// let bytes = CryptoJS.AES.decrypt(requestData.replace(/\./g, '/').replace(/,/g, '+'), CRYPTO_KEY);
	// console.log("bytes "+bytes)
	if(bytes == ''){
		return '';
	} else {		
		let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
		// console.log("decryptedData ")
		// console.log(decryptedData)
		return decryptedData;
	}
    
}
    
    
 let  encryptApi =  (requestData) => {
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(requestData), 'qwerty').toString();
    console.log(ciphertext)
	return ciphertext
}