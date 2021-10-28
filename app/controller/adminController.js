var adminModel = require('../model/admin/adminModel.js');
const jwt = require('jsonwebtoken');
const { body, validationResult , param,query} = require('express-validator/check');
const CryptoJS = require("crypto-js");


exports.validate = (method) => {

    const inputParamVal = [ 
        param('Id', "Id is required").not().isEmpty().isNumeric().withMessage('Id must be numeric')
    ]
    const inputParamVal_2 =  [               
        body('categoryId', "categoryId is required").not().isEmpty().isNumeric().withMessage('CategoryId must be numeric'),
        body('path', "path is required").not().isEmpty(),
        body('description', "description is required").not().isEmpty(),
        body('title', "title is required").not().isEmpty()       
    ]

    switch (method) {
        case 'login': {
            return [
                body('email').not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('password', "password is required").not().isEmpty(),
                // body('role', "role is required").not().isEmpty()
            ]
        }
        case 'addSuperAdmin': {
            return [
                body('email').trim().escape().not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('name', "Name is required").trim().escape().not().isEmpty(),
                body('password', "Password is required").trim().escape().not().isEmpty(),
                // body('role', "role is required").trim().escape().not().isEmpty().isIn(["Admin","SubAdmin"]).withMessage("Valid role value (Admin/Normal) is required"),
            ]
        }
        case 'addAdmin': {
            return [
                body('email').trim().escape().not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('firstName', "firstName is required").trim().escape().not().isEmpty(),
                body('lastName', "lastName is required").trim().escape().not().isEmpty(),               
                body('departmentId', "departmentId is required").not().isEmpty().
                                    isNumeric().withMessage('Only numeric value allowed')     
                // body('department', "department is required").trim().escape().not().isEmpty().isIn(["Sale Manager","Relationship Manager"]).withMessage("Valid department value (Sale Manager/Relationship Manager) is required"),
            ]
        }
        case 'updateAdmin': {
            return [               
                body('firstName').trim().escape(),
                body('lastName').trim().escape(),
                body('email').trim().escape(),                
                body('departmentId', "departmentId is required").optional().
                                    isNumeric().withMessage('Only numeric value allowed')
                // body('department').trim().escape().optional().isIn(["Sale Manager","Relationship Manager"]).withMessage("Valid department value (Sale Manager/Relationship Manager) is required"),
                     
            ]
        } 
        case 'getAdmin': {
            return [               
                // query('search', "search is required").not().isEmpty()    
            ]
        }
        case 'deleteAdmin': {
            return [               
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }
        case 'resetAdminPassword': {
            return [           
                // body('password', "Password is required").trim().escape().not().isEmpty(),    
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }  
        
        case 'forgotpass': {
            return [              
              body('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Please enter a valid email address")
              .isLength({ max: 50 }).withMessage("Email must be less than 50 characters"),
            ]
        }
        case 'resetForgotPassword': {
            return [          
              body('new_pass','new_pass is required').not().isEmpty()
              .matches(/((?=.*[A-Z])(?=.*\W).{6,6})/).withMessage("New Password should be minimum 6 characters and include a capital letter and a special character"),
              body('confirm_pass').not().isEmpty().withMessage('Confirm Password is required').custom((value, { req }) => {                
                return req.body.new_pass === value ?  true : false
              }).withMessage("New password & Confirm password don't match.")
            ]
        }      
        case 'changePassword': {
            return [
              body('current_pass','current_pass is required').not().isEmpty(),
              body('new_pass','new_pass is required').not().isEmpty()
            //   .isLength({ min: 6 })
            //   .withMessage("Password must contain at least 6 characters")
              .matches(/((?=.*[A-Z])(?=.*\W).{6,6})/).withMessage("New Password should be minimum 6 characters and include a capital letter and a special character"),
              body('confirm_pass').not().isEmpty().withMessage('confirm_pass is required').custom((value, { req }) => {               
                return req.body.new_pass === value ?  true : false
              }).withMessage("New password & Confirm password don't match.")
            ]
        }        
       

        case 'addUser': {
            return [
                body('email').trim().escape().not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('firstName', "firstName is required").trim().escape().not().isEmpty(),
                body('lastName', "lastName is required").trim().escape().not().isEmpty(),               
                body('role', "role is required").trim().escape().not().isEmpty().isIn(["Admin","Normal"]).withMessage("Valid role value (Admin/Normal) is required"),
                body('url', "url is required").trim().escape().not().isEmpty(),
                body('brokered').trim().escape().not().isEmpty().withMessage("brokered is required").isIn(["Yes","No"]).withMessage("Valid brokered value (Yes/No) is required"),              
                body('payroll').trim().escape().not().isEmpty().withMessage("payroll is required").isIn(["Yes","No"]).withMessage("Valid payroll value (Yes/No) is required"),          
            ]
        }
        case 'addUserByManager': {
            return [
                body('email').trim().escape().not().isEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
                body('firstName', "firstName is required").trim().escape().not().isEmpty(),
                body('lastName', "lastName is required").trim().escape().not().isEmpty(),               
                body('contactType').trim().escape().optional().
                        isIn(["Broker","Client"])
                        .withMessage("Valid contact type value (Broker/Client) is required"),
                // body('manager', "manager is required").optional().
                //         isNumeric().withMessage('Only numeric value allowed')  ,
                // body('brokered').trim().escape().not().isEmpty().withMessage("brokered is required").
                //         isIn(["Yes","No"]).withMessage("Valid brokered value (Yes/No) is required"),              
                // body('payroll').trim().escape().not().isEmpty().withMessage("payroll is required")
                //         .isIn(["Yes","No"]).withMessage("Valid payroll value (Yes/No) is required"),          
            ]
        }
        case 'blockUnblockClient': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty()
               
            ]
        }
        case 'blockUnblockAdmin': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')   
               
            ]
        }
        case 'changeBlockStatus': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')   
               
            ]
        }
        case 'changeBlockStatusByManager': {
            return [
                body('isBlocked', "isBlocked is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isBlocked type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')  
               
            ]
        }
        
        case 'changePrimaryContactStatus': {
            return [
                body('isPrimary', "isPrimary is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isPrimary type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')   
               
            ]
        }
        case 'changeManagerStatus': {
            return [
                body('isManager', "isManager is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isManager type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')   
               
            ]
        }
        case 'updatePartner': {
            return [   
                body('partnerId', "partnerId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')  ,           
                body('clientName').trim().escape(),
                body('email').trim().escape(),
                body('url').trim().escape(),
                body('brokered').trim().escape().optional().isIn(["Yes","No"]).withMessage("Valid brokered value (Yes/No) is required"),              
                body('payroll').trim().escape().optional().isIn(["Yes","No"]).withMessage("Valid payroll value (Yes/No) is required"),          
                
            ]
        } 
        case 'updateUser': {
            return [               
                body('firstName').trim().escape(),
                body('lastName').trim().escape(),
                body('email').trim().escape(),
                body('userId').trim().escape(),
                body('contactType').trim().escape().optional().isIn(["Broker","Client","Manager","NonManager"]).withMessage("Valid contact type value (Broker/Client/Manager/NonManager) is required"),
                body('manager', "manager is required").optional().
                isNumeric().withMessage('Only numeric value allowed')  
            ]
        } 
        case 'updateUserByManager': {
            return [               
                body('firstName').trim().escape(),
                body('lastName').trim().escape(),
                body('email').trim().escape(),
                body('userId').trim().escape(),
                body('contactType').trim().escape().optional().isIn(["Broker","Client"]).withMessage("Valid contact type value (Broker/Client) is required")
            ]
        } 
        case 'deletePartner': {
            return [               
                body('partnerId', "partnerId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }
        case 'deleteUser': {
            return [               
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }
        case 'changeManagerStatusByManager': {
            return [
                body('isManager', "isManager is required").not().isEmpty()
                .isInt({ min:0, max: 1 }).withMessage('isManager type can be 0 or 1'),
                body('userId', "userId is required").not().isEmpty()
                .isNumeric().withMessage('Only numeric value allowed')   
               
            ]
        }
        case 'updateProfile': {
            return [   
                body('firstName').trim().escape(),
                body('lastName').trim().escape(),               
                body('type').trim().escape().optional().isIn(["SuperAdmin","Admin","Normal"]).withMessage("Valid type value (SuperAdmin/Admin/Normal) is required")            
                
            ]
        } 
        case 'deleteClient': {
            return [               
                body('userId', "userId is required").not().isEmpty().
                isNumeric().withMessage('Only numeric value allowed')               
            ]
        }  
        case 'addCategory': {
            return [
                body('parent_id', "parent_id is required").not().isEmpty(),
                body('name', "name is required").not().isEmpty().isLength({ max: 100 }).withMessage("Name must be less than 100 characters"),             
                body('description', "description is required").not().isEmpty().isLength({max:500}).withMessage("Description must be less than 500 characters"),
               
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
        case 'addVideo': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('Only numeric value allowed'),
                body('thumbnail', "thumbnail is required").not().isEmpty(),
                body('videoPath', "videoPath is required").not().isEmpty(),
                body('description', "description is required").not().isEmpty(),
                body('title', "title is required").not().isEmpty()
               
            ]
        }
        case 'deleteVideo': {
            return inputParamVal
        }
        case 'deleteFAQ': {
            return inputParamVal
        }
        case 'deleteProduct': {
            return inputParamVal
        }        
        case 'deleteProgram': {
            return inputParamVal
        }                
        case 'addFAQ': {
            return [               
                body('categoryId', "categoryId is required").not().isEmpty()
                .isNumeric().withMessage('CategoryId must be numeric'),
                body('answer', "answer is required").not().isEmpty().isLength({ max: 1000 }).withMessage("Name must be less than 1000 characters"),
                body('question', "question is required").not().isEmpty().isLength({ max: 500 }).withMessage("Name must be less than 500 characters")
               
            ]
        }
        case 'addEmailTemplate': {
            return inputParamVal_2
        }
        case 'addWordDoc': {
            return inputParamVal_2
        }
        case 'addBenfitslide': {
            return inputParamVal_2
        }
       
        
    }
};

const signupFailures = ({ location, msg, parameter, value, nestedErrors }) => {
    return {
        param: parameter,
        message: msg,
        nestedErrors: nestedErrors
    }
};

/** method for signin */
module.exports.signIn = async (req, res, next) => {
  
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.login(req.body.email, req.body.password, req.body.role)
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": result.message, data: result.data });        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


/** **********************************************************************
 *                  Admin & Super admin  Related  Methods
**************************************************************************/
module.exports.addSuperAdmin = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.addSuperAdmin(req.body)    
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getDepartment = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getDepartment(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message ,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addAdmin = async (req, res, next) => {
    console.log(req)
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    // console.log(req.userId," user_id")
    req.body.userId =  req.userId
    const result = await adminModel.addAdmin(req.body)    
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.blockUnblockAdmin_old = async (req, res, next) => {
    // console.log(req)
    // req.body = ''
    var request = req
    var requestData = req.body.inputData		
	let decryptedData = decryptApi(requestData)
    console.log("--decruted data ---")
    console.log(decryptedData)
    request.body = decryptedData
    console.log("--request data ---")
    // console.log(request)
	// if(decryptedData == ''){
	// 	return res.status(200).json({ 
	// 		type: "body",
	// 		message: 'Invalid encrypted string data' 
	// 	}) 
	// }		
	// const  body  = decryptedData; 

    // var encryptedData = encryptApi( req)
    // var decryptedData = decryptApi( req )
    // console.log(encryptApi( req.body))
    // console.log(decryptedData)

    // const errors = validationResult(request).formatWith(signupFailures);
    // const errors = validationResult(decryptedData).formatWith(signupFailures);
    // console.log(errors)
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
  

    const isBlock = req.body.isBlocked;
    const userId = req.body.userId;
    const result = await adminModel.blockUnblockAdmin(isBlock,userId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.blockUnblockAdmin = async (req, res, next) => {
   
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }  

    const isBlock = req.body.isBlocked;
    const userId = req.body.userId;
    const result = await adminModel.blockUnblockAdmin(isBlock,userId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteAdmin = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    
    const userId = req.body.userId;
    const result = await adminModel.deleteAdmin(userId)    
    if (result.status == 1) {    
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message});

    }
}

module.exports.updateAdmin  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        const result = await adminModel.updateAdmin(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message});           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.changePassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        console.log(req.userId,"ID")
        console.log(req.body,"body")
        const result = await adminModel.changePassword(req.body,req.userId);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message });           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.resetAdminPassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        
        const result = await adminModel.resetAdminPassword(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message });           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.getAdmin = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getAdmin(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.changeBlockStatus = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isBlock = req.body.isBlocked;
    const userId = req.body.userId;
    const result = await adminModel.changeBlockStatus(isBlock,userId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.changeManagerStatus = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isManager = req.body.isManager;
    const userId = req.body.userId;
    const result = await adminModel.changeManagerStatus(isManager,userId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.changePrimaryContactStatus = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isPrimary = req.body.isPrimary;
    const userId = req.body.userId;
    const result = await adminModel.changePrimaryContactStatus(isPrimary,userId)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.forgotPassword = async(req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    try {
        const result = await adminModel.forgotPassword(req.body.email);
        if (result.status == 1) {
            res.status(200).json({ status: 1, message: result.message });
        }
        else {
            res.status(200).json({ status: 0, message: result.message });
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.resetForgotPassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }       
    
        const result = await adminModel.resetForgotPassword(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message });           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}


module.exports.getProfile = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    // let userId = req.body.userId
    const result = await adminModel.getProfile(req.userId)
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": 'success', data:result.data});       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** **********************************************************************
 *                 Partners  Related  Methods
**************************************************************************/

module.exports.addPartner = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    let userId = req.body.userId
    const result = await adminModel.addPartner(req.body,userId)    
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.updatePartner  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        
        const result = await adminModel.updatePartner(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message });           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.deletePartner = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    
    const partnerId = req.body.partnerId;
    const result = await adminModel.deletePartner(partnerId)    
    if (result.status == 1) {    
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message});

    }
}

module.exports.getPartner = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getPartner(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message ,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getAllPartner = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const userId   = req.userId;
    const userType = req.userType;
    console.log("userId ", userId)
    console.log("userType ", userType)
    const result = await adminModel.getAllPartner(req.query,userId,userType)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message ,totalRecord:result.totalRecords,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.assignUserToPartner = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.assignUserToPartner(req.body,req.userId)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });
    }
}

module.exports.updateUser = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.updateUser(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.deleteUser = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    
    const userId = req.body.userId; 
    const result = await adminModel.deleteUser(userId)    
    if (result.status == 1) {    
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message});

    }
}



module.exports.updateProfile = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.updateProfile(req.body,req.userId)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.getClient = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getClient(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.blockUnblockClient = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const isBlock = req.body.isBlocked;
    const userId = req.body.userId;
    const result = await adminModel.blockUnblockClient(isBlock,userId)    
    if (result.status) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteClient = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    
    const userId = req.body.userId;
    const result = await adminModel.deleteClient(userId)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}

module.exports.blockSiteAccess = async (req, res, next) => {
   
    const result = await adminModel.blockSiteAccess(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.resendClientInvitation = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.resendClientInvitation(req.body.userId)    
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.updateAnyUser  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(signupFailures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        const result = await adminModel.updateAnyUser(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message});           
        }
        else {
            res.status(200).json({ status: 0, "message": result.message });
        }
    } catch(error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error);
    }
}

module.exports.dashboard = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.dashboard(req.body.userId)    
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', data: result.data });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



/** **********************************************************************
 *                  Manager and Non-manager  Related  Methods
**************************************************************************/
module.exports.addUserByManager = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addUserByManager(req.body,req.userId)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });
    }
}

module.exports.updateUserByManager = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.updateUserByManager(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getUserByManager = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    // console.log(req.userId, " userId ")
    const userId = req.userId;
    req.query.userId = userId
    const result = await adminModel.getUserByManager(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.changeBlockStatusByManager = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
   
    const result = await adminModel.changeBlockStatusByManager(req.body)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.changeManagerStatusByManager = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.changeManagerStatusByManager(req.body)      
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** **********************************************************************
 *                  Category  Related  Methods
**************************************************************************/
module.exports.addCategory = async (req, res, next) => {
    
    const errors = validationResult(req).formatWith(signupFailures);
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
 
    const errors = validationResult(req).formatWith(signupFailures);
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
    
    const errors = validationResult(req).formatWith(signupFailures);
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

module.exports.getParentCategory = async (req, res, next) => {
    
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getParentCategory(req.body)
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
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addProduct(req.body)
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": 'success'});       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getProduct = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getProduct(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteProduct = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
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
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addVideo(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getVideo = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getVideo(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteVideo = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
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
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addEmailTemplate(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addWordDoc = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addWordDoc(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addBenfitslide = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.addBenfitslide(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success'});
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.deleteProgram = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
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
 
    const errors = validationResult(req).formatWith(signupFailures);
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
 
    const errors = validationResult(req).formatWith(signupFailures);
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

module.exports.resendOTP = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }

    const result = await adminModel.resendOTP(req.body)    
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getUser = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getUser(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



module.exports.deleteAllUser = async (req, res, next) => {
 
    const result = await adminModel.deleteAllUser(req)    
    if (result) {       
        res.status(200).json({ status: 1, "message": 'success' });
    }
    else {
        res.status(200).json({ status: 0, "message":'failed' });

    }
}


module.exports.uploadUserExcel = async (req,res,next)=> {   
    const result = await adminModel.uploadUserExcel(req);  
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


module.exports.uploadUserBulk = async (req,res,next)=> {   
    const result = await adminModel.uploadUserBulk(req);  
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
 
    const errors = validationResult(req).formatWith(signupFailures);
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
 
    const errors = validationResult(req).formatWith(signupFailures);
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
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await adminModel.getFAQ(req.query)
    if (result.status == 1) {  
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
  
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



module.exports.uploadPDF = async (req,res,next)=> {   
    const result = await adminModel.uploadPDF(req);  
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

module.exports.readJson = async (req,res,next)=> {   
    const result = await adminModel.readJson(req);  
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



module.exports.updateInvitationUser = async (req, res, next) => {
   
    const result = await adminModel.updateInvitationUser(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.updateSiteAccess = async (req, res, next) => {
   
    const result = await adminModel.updateSiteAccess(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.sendInvitationUser = async (req,res,next)=> {   
    const result = await adminModel.sendInvitationUser(req);  
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

module.exports.uploadUserBulk = async (req,res,next)=> {   
    const result = await adminModel.uploadUserBulk(req);  
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

/** method for signin */
module.exports.testMail = async (req, res, next) => { 
    
    const result = await adminModel.testMail(req.body.email)

    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message,data:result.data});        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}



module.exports.encryptData = async (req, res, next) => {
   
    const result = await adminModel.encryptData(req.body)    
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": result.message,encryptData:result.data,decryptData:result.decrypt });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

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