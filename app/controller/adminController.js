var adminModel = require('../model/admin/adminModel.js');
const jwt = require('jsonwebtoken');
const { body, validationResult , param} = require('express-validator/check');

exports.validate = (method) => {
    switch (method) {
        case 'login': {
            return [
                body('email').not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('password', "password is required").not().isEmpty()
            ]
        }
        case 'addCategory': {
            return [
                body('name', "name is required").not().isEmpty(),             
                body('description', "description is required").not().isEmpty(),
               
            ]
        }
        case 'addProduct': {
            return [
                body('name', "name is required").not().isEmpty(),
                body('title', "title is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty(),
                body('image', "description is required").not().isEmpty()
            ]
        }
        case 'addUser': {
            return [
                body('email').trim().escape().not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('firstName', "firstName is required").trim().escape().not().isEmpty(),
                body('lastName', "lastName is required").trim().escape().not().isEmpty(),
                // body('phone', "phone is required").trim().escape().not().isEmpty(),
                body('role', "role is required").trim().escape().not().isEmpty().isIn(["Admin","Normal"]).withMessage("Valid role value (Admin/Normal) is required"),
                body('url', "url is required").trim().escape().not().isEmpty(),
                body('brokered').trim().escape().not().isEmpty().withMessage("brokered is required").isIn(["Yes","No"]).withMessage("Valid brokered value (Yes/No) is required"),              
                body('payroll').trim().escape().not().isEmpty().withMessage("payroll is required").isIn(["Yes","No"]).withMessage("Valid payroll value (Yes/No) is required"),          
            ]
        }
        case 'blockUnblockUser': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty()
               
            ]
        }
        case 'blockUnblockProgram': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('Id', "Id is required").not().isEmpty()
               
            ]
        }
        
        case 'blockUnblockCategory': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('catId', "catId is required").not().isEmpty()
               
            ]
        }
        case 'deleteUser': {
            return [               
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }
        case 'addVideo': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('Only numeric value allowed'),
                body('videoPath', "videoPath is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty()
               
            ]
        }
        case 'deleteVideo': {
            return [               
                param('Id', "Id is required").not().isEmpty().
                isNumeric().withMessage('Id must be numeric')               
            ]
        }
        case 'deleteFAQ': {
            return [               
                param('Id', "Id is required").not().isEmpty().
                isNumeric().withMessage('Id must be numeric')               
            ]
        }
        case 'deleteProduct': {
            return [               
                param('Id', "Id is required").not().isEmpty().
                isNumeric().withMessage('Id must be numeric')               
            ]
        }
                
        case 'addFAQ': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('CategoryId must be numeric'),
                body('answer', "answer is required").not().isEmpty(),
                body('question', "question is required").not().isEmpty()
               
            ]
        }
        case 'addEmailTemplate': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('CategoryId must be numeric'),
                body('path', "path is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty(),
                body('title', "title is required").not().isEmpty()
               
            ]
        }
        case 'addWordDoc': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('CategoryId must be numeric'),
                body('path', "path is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty(),
                body('title', "title is required").not().isEmpty()
               
            ]
        }
        case 'addBenfitslide': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('CategoryId must be numeric'),
                body('path', "path is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty(),
                body('title', "title is required").not().isEmpty()
               
            ]
        }
        case 'deleteProgram': {
            return [               
                param('Id', "Id is required").not().isEmpty().
                isNumeric().withMessage('Id must be numeric')               
            ]
        }
        
    }
};

const signupFailures = ({ location, msg, param, value, nestedErrors }) => {
    return {
        param: param,
        message: msg,
        nestedErrors: nestedErrors
    }
};

/** method for signin */
module.exports.signIn = async (req, res, next) => {
  
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.login(req.body.email, req.body.password)
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": result.message, data: result.data });        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



/** **********************************************************************
 *                  Category  Related  Methods
**************************************************************************/
module.exports.addCategory = async (req, res, next) => {
    
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addCategory(req.body)
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": 'success'});        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.blockUnblockCategory = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isBlock = req.body.isBlocked;
    const catId = req.body.catId;
    const result = await adminModel.blockUnblockCategory(isBlock,catId)    
    if (result.status) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getCategory = async (req, res, next) => {
    
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getCategory(req.body)
    if (result.status == 1) {       
        res.status(200).json({ status: 1,"message": result.message, data:result.data});        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}




/** **********************************************************************
 *                  Products  Related  Methods
**************************************************************************/
module.exports.addProduct = async (req, res, next) => {
    // console.log(req.body);
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addProduct(req.body)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success'});
        // res.status(200).json({ status: 1, "message": result.message, token: result.token, userId: result.userId, first_name: result.first_name, last_name: result.last_name });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getProduct = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getProduct(req.query)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteProduct = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const userId = req.params.Id;
    const result = await adminModel.deleteProduct(userId)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}


/** **********************************************************************
 *                  Video  Related  Methods
**************************************************************************/
module.exports.addVideo = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addVideo(req.body)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getVideo = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getVideo(req.query)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteVideo = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const userId = req.params.Id;
    const result = await adminModel.deleteVideo(userId)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}


/** **********************************************************************
 *                  Home Programs  Related  Methods
**************************************************************************/
module.exports.addEmailTemplate = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addEmailTemplate(req.body)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addWordDoc = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addWordDoc(req.body)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addBenfitslide = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addBenfitslide(req.body)
    if (result.status == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteProgram = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const userId = req.params.Id;
    const result = await adminModel.deleteProgram(userId)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}

module.exports.blockUnblockProgram = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isBlock = req.body.isBlocked;
    const catId = req.body.Id;
    const result = await adminModel.blockUnblockProgram(isBlock,catId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


/** **********************************************************************
 *                  USER  Related  Methods
**************************************************************************/
module.exports.addUser = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.addUser(req.body)    
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.blockUnblockUser = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isBlock = req.body.isBlocked;
    const userId = req.body.userId;
    const result = await adminModel.blockUnblockUser(isBlock,userId)    
    if (result.status) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteUser = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    
    const userId = req.body.userId;
    const result = await adminModel.deleteUser(userId)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}

module.exports.uploadUserExcel = async (req,res,next)=> {   
    const result = await adminModel.uploadUserExcel(req);  
    console.log("in common controller")
    console.log(result) 
    if(result.statusCode == "500") {
        const error = new Error(result.message);
        res.statusCode = 400;
        throw error;
    } else if(result.statusCode == "200") {
        res.status(200).json({error: 1, message: result.message });  
    } else {
        res.status(200).json({error: 0, message: "Excel added successfully." });  
    }

}


/** **********************************************************************
 *                  FAQ  Related Methods
**************************************************************************/
module.exports.addFAQ = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.addFAQ(req.body)    
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteFAQ = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const Id = req.params.Id;
    const result = await adminModel.deleteFAQ(Id)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}

module.exports.getFAQ = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);;
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getFAQ(req.query)
    if (result.status == 1) {
        console.log(result.data);
        // res.status(200).json({ status: 1, "message": 'success', data:result.data });     
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
  
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



module.exports.uploadPDF = async (req,res,next)=> {   
    const result = await adminModel.uploadPDF(req);  
    console.log("in common controller")
    console.log(result) 
    if(result.statusCode == "500") {
        const error = new Error(result.message);
        res.statusCode = 400;
        throw error;
    } else if(result.statusCode == "200") {
        res.status(200).json({error: 1, message: result.message, data:result.data });  
    } else {
        res.status(200).json({error: 0, message: "Excel added successfully." });  
    }

}