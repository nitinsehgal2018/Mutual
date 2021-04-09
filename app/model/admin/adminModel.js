'user strict';
const  connection  = require('../../../db.js');
const  template =  require('../../emailTemplate/signupTemplate')
const commonModel = require('../commonModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mail = require('../../middleware/mail.js');
const readXlsxFile = require("read-excel-file/node");
const path = require('path');     
const { exit } = require('process');

/* login user method */
module.exports.login = async (email, password) => {   
    try {        
        var conn = await connection.getConnection();     
        const [rows, fields]  =  await conn.execute('SELECT * FROM users WHERE email = ? AND role = "Admin"',[email]); 
       
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
            if (!isEqual) {
                conn.release();
                return {
                    message: "Please enter correct password.",
                    loggedin: 0
                };
            }
            else {

                //genrate json web token
                const token = jwt.sign({
                    email: email,
                    user_id: rows[0].id,
                    user_type :"ADMIN"
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
            message: "Please enter correct email id.",
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
 *        List of Product and Category Related Function
**************************************************************************/

module.exports.addProduct = async (body) => {   
    try {
         
        let payloadData = { 
            name :body.name, title:body.title, 
            description:body.description, image:body.image ,pdf_path:body.pdf_path 
        }
        // console.log(payloadData)
        var conn = await connection.getConnection();   
        const [rows, fields]  =  await conn.execute('SELECT * FROM products WHERE name = ? ',[body.name]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Product already exists.",
                    loggedin: 0
                };
        } else {
    
            const [rows, fields]  = await conn.execute(`INSERT INTO products (name,title,description,image,pdf_path) VALUES(?,?,?,?,?)`,
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


module.exports.addCategory = async (body) => {   
    try {
         
        let payloadData = { 
            name :body.name, description:body.description
        }
        console.log(payloadData)
        var conn = await connection.getConnection();   
        const [rows, fields]  =  await conn.execute('SELECT * FROM categories WHERE name = ? ',[body.name]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Category already exists.",
                    loggedin: 0
                };
        } else {
    
            const [rows, fields]  = await conn.execute(`INSERT INTO categories (name,description) VALUES(?,?)`,
            [payloadData.name,payloadData.description]) ;
            
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM categories WHERE isDeleted = 0');      
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
        const [rows, fields]  =  await conn.execute('SELECT id FROM categories WHERE id = ?',[catId]);      
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM videos WHERE videoPath = ? ',[body.videoPath]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Video already exists.",
                    loggedin: 0
                };
        } else {
    
            const [rows, fields]  = await conn.execute(`INSERT INTO videos (categoryId,videoPath,description) VALUES(?,?,?)`,
            [body.categoryId,body.videoPath,body.description]) ;
            
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
        const [rows, fields]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No Videos exists.",
                    status:0
                };
        } else {
            const [result, fields]  =  await conn.execute(`SELECT videos.id,videos.videoPath,videos.description,categories.name as categoryName FROM videos INNER JOIN categories ON videos.categoryId = categories.id  WHERE categories.isBlocked = 0 AND categories.type = 0 AND videos.isBlocked = 0 order by videos.createdDate`);
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ? ',[body.path,0]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email template already exists.",
                    loggedin: 0
                };
        } else {
            
            console.log(body)
            const [rows, fields]  = await conn.execute(`INSERT INTO programs (categoryId,path,title,description) VALUES(?,?,?,?)`,
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ?',[body.path,1]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email template already exists.",
                    loggedin: 0
                };
        } else {
            
            console.log(body)
            const [rows, fields]  = await conn.execute(`INSERT INTO programs (categoryId,path,title,description,type) VALUES(?,?,?,?,?)`,
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM programs WHERE path = ? AND type = ?',[body.path,2]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Word template already exists.",
                    loggedin: 0
                };
        } else {
            
            console.log(body)
            const [rows, fields]  = await conn.execute(`INSERT INTO programs (categoryId,path,title,description,type) VALUES(?,?,?,?,?)`,
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
        const [rows, fields]  =  await conn.execute('SELECT id FROM programs WHERE id = ?',[catId]);      
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
        const password = generatePassword();      
        const hashPassword = await bcrypt.hash(password, 12);
        body.password = hashPassword;
        const [rows, fields]  =  await conn.execute('SELECT * FROM users WHERE email = ? ',[body.email]);      
        if (rows.length > 0) {
            conn.release();
            return {
                    message: "Email already  exists.",
                    loggedin: 0
                };
        } else {
            
            const rows = await commonModel.insertData('users',body);
            const lastInsertId = rows.insertId;     
                    
            const subject = "Liberty Mutual - SignUp";
            const from = 'Liberty Mutual Admin<testing.mobileprogramming@gmail.com>';
            const to = payloadData.email;
            payloadData.logo = BaseURL+'/liberty_logo.jpg'
            payloadData.password = password
           
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

module.exports.blockUnblockUser = async (isBlock, userId) => {
    try {
       var  conn = await connection.getConnection();
       const [rows, fields]  =  await conn.execute('SELECT id FROM users WHERE id = ?',[userId]);      
       if (rows.length  == 0) {
           conn.release();
           return {
                   message: "User does not exists.",
                   status: 0
               };
       }  

        //if user type is 1 and is_block=1
        if ( isBlock == 1) {
            const result = await conn.execute(`UPDATE users SET isBlocked = 1 WHERE id=? `, [userId]);
            if (result[0].affectedRows) {
                return {              
                    status: 1,
                    message:"Blocked Successfully"                               
                };
            }
        }
        else if ( isBlock == 0) {
            const result = await conn.execute(`UPDATE users SET isBlocked = 0 WHERE id=? `, [userId]);
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

module.exports.deleteUser = async (userId) => {
    try {
       var  conn = await connection.getConnection();
       const result = await conn.execute(`UPDATE users SET isDeleted = 1 WHERE id=? `, [userId]);
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
        const [rows, fields]  =  await conn.execute('SELECT * FROM faq WHERE question = ?',[body.question]);         
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
        const [rows, fields]  =  await conn.execute(`SELECT faq.id as Id, faq.question, faq.answer,categories.id as category_id, categories.name as categoryName  FROM categories INNER JOIN faq on categories.id = faq.categoryId  WHERE categories.type = 1  limit ${limit} OFFSET ${offset}`);      
        if (rows.length == 0) {
            conn.release();
            return {
                    message: "No FAQ exists.",
                    status:0
                };
        } else {
            const [rows1, fields]  = await conn.execute(`SELECT categories.id as category_id, categories.name as category_name , faq.question, faq.answer FROM categories INNER JOIN faq on categories.id = faq.categoryId WHERE categories.type = 1`);
           
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
module.exports.uploadUserExcel =  async (req, res) => {
    try {  
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;		 
        var checkFileError =  false;

        console.log(req.file)
        if (!req.file.mimetype.includes("excel") || !req.file.mimetype.includes("spreadsheetml")) {
            var response  = {
                statusCode:200,
                message:'Please upload an excel file only'
            }
            fs.unlinkSync(Filepath);
            return response;
        } 

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
            // console.log("--- Enter to check Excel   --- ")           
            if(rows[0][0] !== 'firstName' || rows[0][1] !== 'lastName' || rows[0][2] !== 'Email' || rows[0][3] !== 'Phone') {               
                checkFileError =  true;                        
            }
        })

        if(checkFileError == false){
            // console.log("--- Enter outside chck exvel --")
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
    
                  // Insert Into DB
                  var userResult  = await poolPromise.query('SELECT * FROM users WHERE email = ? ',[tutorial.email]);             
                  if(userResult.length == 0){
                    await poolPromise.query("INSERT INTO users SET ? ", tutorial);  
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

var AWS = require("aws-sdk");
AWS.config.update({
    "accessKeyId": "AKIARWLYRBSQ5Q5B7NUC",
    "secretAccessKey": '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',
    // "s3URL": "https://s3-us-west-2.amazonaws.com/mak-s3/",
    "folder": {
        "ProfilePics": "ProfilePics",
        // "thumb": "thumb"
    }
});
var s3 = new AWS.S3();
module.exports.uploadPDF =  async (req, res) => {
    try {  
        // Reads Excel file  Check Coloumn field Name in Excel 
        let Filepath =  path.join(__dirname, '../../../uploads/') + req.file.filename;		 
        var checkFileError =  false;
        // console.log(req.file)
        if (!req.file.mimetype.includes("pdf")) {
            var response  = {
                statusCode:200,
                message:'Please upload an image and pdf file only'
            }
            fs.unlinkSync(Filepath);
            return response;
        } 

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
			ContentType: 'application/pdf'
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


/** method for random genrate password */
function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
