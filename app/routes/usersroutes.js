var express = require('express');
const rateLimit = require("express-rate-limit");
var router = express.Router();
const userController = require('../controller/userController');
const valid_recruiter = require('../middleware/valid_recruiter');
// Rate limiter 
const loginRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000 , // 5 min window
    max: 50, // start blocking after 5 requests
    message:
      "Too many request from this IP, please try again after an hour"
});
const forgotPwdRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000 , // 5 min window
    max: 50, // start blocking after 5 requests
    message:
      "Too many request from this IP, please try again after an hour"
});
// https://github.com/hengkiardo/express-enforces-ssl


/** **********************************************************************
 *                  List of User Related  Routes 
**************************************************************************/
router.post('/login',userController.validate('login'),userController.signIn);
router.post('/signup',userController.validate('signup'),userController.signup);
router.post('/forgotPassword',forgotPwdRateLimiter,userController.validate('forgotpass'),userController.forgotPassword);
router.post('/resetForgotPassword',forgotPwdRateLimiter,userController.validate('resetForgotPassword'),userController.resetForgotPassword);
router.post('/changePassword',forgotPwdRateLimiter,valid_recruiter,userController.validate('changePassword'),userController.changePassword);
router.post('/resetPassword',valid_recruiter,userController.validate('resetPassword'),userController.resetPassword);
router.put('/updateProfile',valid_recruiter,userController.validate('updateProfile'),userController.updateProfile);
router.get('/getProfile',valid_recruiter,userController.getProfile);



/** **********************************************************************
 *        List of Product and category Related  Routes 
 **************************************************************************/
router.get('/getProduct',valid_recruiter,userController.validate('getProduct'),userController.getProduct);
router.get('/getFAQ',valid_recruiter,userController.getFAQ);
router.get('/getVideo',valid_recruiter,userController.validate('getContentVideo'),userController.getVideo);    
router.get('/getProgram',valid_recruiter,userController.validate('getProgram'),userController.getProgram);
router.get('/getParentCategory',valid_recruiter,userController.getParentCategory);
router.get('/search',valid_recruiter,userController.validate('search'),userController.search);


router.get('/getUsers',valid_recruiter,userController.getUsers);
router.post('/addUser',valid_recruiter,userController.addUser);
router.get('/getUserList',valid_recruiter,userController.getUserList);
router.get('/getClientList',valid_recruiter,userController.getClientList);


const upload = require("../middleware/upload");
router.post('/convertPDFTOIMAGE',upload.single("file"),userController.convertPDFTOIMAGE);


module.exports = router;