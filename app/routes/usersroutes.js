var express = require('express');
var router = express.Router();
const userController = require('../controller/userController');
const valid_recruiter = require('../middleware/valid_recruiter');

/** **********************************************************************
 *                  List of User Related  Routes 
**************************************************************************/
router.post('/login',userController.validate('login'),userController.signIn);
router.post('/signup',userController.validate('signup'),userController.signup);
router.post('/forgotPassword',userController.validate('forgotpass'),userController.forgotPassword);
router.post('/resetForgotPassword',userController.validate('resetForgotPassword'),userController.resetForgotPassword);
router.post('/changePassword',valid_recruiter,userController.validate('changePassword'),userController.changePassword);
router.post('/resetPassword',valid_recruiter,userController.validate('resetPassword'),userController.resetPassword);
router.put('/updateProfile',valid_recruiter,userController.validate('updateProfile'),userController.updateProfile);
router.get('/getProfile',valid_recruiter,userController.getProfile);
router.get('/getFAQ',userController.getFAQ);
router.get('/getVideo',userController.getVideo);
router.get('/getProgram',userController.getProgram);



/** **********************************************************************
 *        List of Product and category Related  Routes 
 **************************************************************************/
router.get('/getProduct',userController.getProduct);

module.exports = router;