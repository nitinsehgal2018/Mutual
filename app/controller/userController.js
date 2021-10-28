var userModel = require('../model/users/userModel.js');
const jwt = require('jsonwebtoken');
const { body, validationResult, param,query} = require('express-validator/check');

exports.validate = (method) => {
    switch (method) {
        case 'login': {
            return [
                body('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Please enter a valid email address")
                .isLength({ max: 50 }).withMessage("Email must be less than 50 characters"),
                body('password', "password is required").not().isEmpty()
            ]
        }
        case 'signup': {
            return [
                body('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Please enter a valid email address"),
                body('firstName', "firstName is required").not().isEmpty(),
                body('lastName', "lastName is required").not().isEmpty(),
                body('phone', "phone is required").not().isEmpty(),
                body('role', "role is required").not().isEmpty()
            ]
        }
        case 'updateProfile': {
            return [               
                body('firstName').trim().escape(),
                body('lastName').trim().escape(),
                body('url').trim().escape()
              
            ]
        }  
        case 'resetPassword': {
            return [          
              body('new_pass','new_pass is required').not().isEmpty()
              .matches(/((?=.*[A-Z])(?=.*\W).{6,6})/).withMessage("New Password should be minimum 6 characters and include a capital letter and a special character"),
              body('confirm_pass').not().isEmpty().withMessage('Confirm Password is required').custom((value, { req }) => {                
                return req.body.new_pass === value ?  true : false
              }).withMessage("New password & Confirm password don't match.")
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
        case 'forgotpass': {
            return [              
              body('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Please enter a valid email address")
              .isLength({ max: 50 }).withMessage("Email must be less than 50 characters"),
            ]
        }
        case 'getContentVideo': {
            return [               
                // param('categoryId', "categoryId is required").not().isEmpty().
                query('categoryId', "categoryId is required").not().isEmpty().
                isNumeric().withMessage('categoryId must be numeric')           
            ]
        }
        case 'getProduct': {
            return [               
                query('categoryId', "categoryId is required").not().isEmpty().
                isNumeric().withMessage('categoryId must be numeric')     
            ]
        }
        case 'getProgram': {
            return [               
                query('categoryId', "categoryId is required").not().isEmpty().
                isNumeric().withMessage('categoryId must be numeric')     
            ]
        }
        case 'search': {
            return [               
                query('keyword', "keyword is required").not().isEmpty()                 
            ]
        }
    }
};

const failures = ({ location, msg, parameter, value, nestedErrors }) => {
    return {
        param: parameter,
        message: msg,
        nestedErrors: nestedErrors
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
    const result = await userModel.login(req.body.email, req.body.password)
    if (result.loggedin == 1) {
        res.status(200).json({ status: 1, "message": result.message, data: result.data });        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** method for signup */
module.exports.signup = async (req, res, next) => {
 
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.signup(req.body)
    
    if (result.loggedin == 1) {
        console.log(result);
        res.status(200).json({ status: 1, "message": 'success', data: result });
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/* Change password */
module.exports.updateProfile  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(failures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        
        const result = await userModel.updateProfile(req.body);       
        if (result.status == 1) {           
            res.status(200).json({ status: 1, "message": result.message, data:result.data });           
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

/** method for getProfile */
module.exports.getProfile = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getProfile(req.body)
    if (result.status == 1) {       
        res.status(200).json({ status: 1, "message": 'success', data:result.data});       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/* Reset password */
module.exports.resetPassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(failures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        
        const result = await userModel.resetPassword(req.body);       
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

/* Reset password */
module.exports.resetForgotPassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(failures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }       
    
        const result = await userModel.resetForgotPassword(req.body);       
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

/* Change password */
module.exports.changePassword  = async (req, res, next) => {
    try{
        const errors = validationResult(req).formatWith(failures);
        if(!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        
        const result = await userModel.changePassword(req.body);       
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

/** forgot password */
module.exports.forgotPassword = async(req, res, next) => {
    const errors = validationResult(req).formatWith(failures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    try {
        const result = await userModel.forgotPassword(req.body.email);
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

/** method for Parent Category */
module.exports.getParentCategory = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getParentCategory(req.body)
    if (result.status == 1) {     
        res.status(200).json({ status: 1, "message": 'success', data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** method for getProduct */
module.exports.getProduct = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getProduct(req.query,req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** method for get Content Video */
module.exports.getVideo = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    // console.log( req.params)
    // const Id = req.params.Id;
    const result = await userModel.getVideo(req.query,req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', data:result.data});        
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

/** method for FAQ */
module.exports.getFAQ = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getFAQ(req.body)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', data:result.data, f_rsult : result.data_1 });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getProgram = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getProgram(req.query,req.body)
    if (result.status == 1) {  
        res.status(200).json({ 
            status: 1, 
            message: 'success',
            data:result.data, 
            // email_data:result.data, 
            // benefit_data:result.data_benefit,
            // slide_data:result.data_slide
         });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.search = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.search(req.query,req.body)
    if (result.status == 1) {  
        res.status(200).json({ 
            status: 1, 
            message: 'success',
            // autoHome:result.autoHome,
            // vidoes:result.vidoes,
            // products:result.products,
            // faqs:result.faq,
            data:result.data
         });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getUsers = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const userId = req.body.userId;
    const result = await userModel.getUsers(req.query,userId)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.addUser = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    // const userId = req.body.userId;
    // const result = await userModel.getUsers(req.query,userId)
    const result = await userModel.addUser(req.body,req.body.userId)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": result.message });    
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}


module.exports.getUserList = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getUserList(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.getClientList = async (req, res, next) => {
    const errors = validationResult(req).formatWith(signupFailures);
    if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
    }
    const result = await userModel.getClientList(req.query)
    if (result.status == 1) {
        res.status(200).json({ status: 1, "message": 'success', totalRecord:result.totalRecords,page: result.page_number,data:result.data });       
    }
    else {
        res.status(200).json({ status: 0, "message": result.message });

    }
}

module.exports.convertPDFTOIMAGE = async (req, res, next) => {
    const path = require('path');
    let Filepath =  path.join(__dirname, '../../uploads/') + req.file.filename;	
    const pdf = require('pdf-poppler');
    //  console.log(Filepath)
    let file = Filepath
    console.log(path.dirname(file))
    let opts = {
        format: 'jpeg',
        out_dir:path.dirname(file),
        // out_dir: 'D:/MPLLC/liberty_node/uploads/1624445295806-mpllc-EmailCWBrokerPayrollAuto.pdf',
        // out_prefix:path.join(__dirname, '../../uploads/'),  
        scale: 4096,
        out_prefix :Date.now()+'-pdf',
        // page: 3,
    
    }
 
    pdf.convert(file, opts)
        .then(result => {
            console.log('Successfully converted');
        })
        .catch(error => {
            console.error(error);
        })
   
}