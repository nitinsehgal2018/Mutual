var express = require('express');
var router = express.Router();
const adminController = require('../controller/adminController');
const is_admin = require('../middleware/is_auth');
const upload = require("../middleware/upload");

// Route for admin login
router.post('/login',adminController.validate('login'),adminController.signIn);


/** **********************************************************************
 *        List of Product Related  Routes 
 **************************************************************************/
router.post('/addProduct',adminController.validate('addProduct'),adminController.addProduct);
router.get('/getProduct',adminController.getProduct);   
router.delete('/deleteProduct/:Id',adminController.validate('deleteProduct'),adminController.deleteProduct);


/** **********************************************************************
 *        List of category Related  Routes 
 **************************************************************************/
router.post('/addCategory',adminController.validate('addCategory'),adminController.addCategory);
router.get('/getCategory',adminController.getCategory);
router.get('/getParentCategory',adminController.getParentCategory);
router.post('/blockUnblockCategory',adminController.validate('blockUnblockCategory'),adminController.blockUnblockCategory);


/** **********************************************************************
 *        List of VIdeos Related  Routes 
 **************************************************************************/
 router.post('/addVideo',adminController.validate('addVideo'),adminController.addVideo);
 router.get('/getVideo',adminController.getVideo);   
 router.delete('/deleteVideo/:Id',adminController.validate('deleteVideo'),adminController.deleteVideo);

 
/** **********************************************************************
 *        List of  Programm Related  Routes 
 **************************************************************************/
 router.post('/addEmailTemplate',adminController.validate('addEmailTemplate'),adminController.addEmailTemplate);
 router.post('/addWordDoc',adminController.validate('addWordDoc'),adminController.addWordDoc);
 router.post('/addBenfitslide',adminController.validate('addBenfitslide'),adminController.addBenfitslide);
 router.delete('/deleteProgram/:Id',adminController.validate('deleteProgram'),adminController.deleteProgram);
 router.post('/blockUnblockProgram',adminController.validate('blockUnblockProgram'),adminController.blockUnblockProgram);

/** **********************************************************************
 *        List of FAQ Related  Routes 
 **************************************************************************/
router.post('/addFAQ',adminController.validate('addFAQ'),adminController.addFAQ);
router.get('/getFAQ',adminController.getFAQ);
router.delete('/deleteFAQ/:Id',adminController.validate('deleteFAQ'),adminController.deleteFAQ);



/** **********************************************************************
 *        List of User Related  Routes likes add user, block user 
 **************************************************************************/
router.post('/addUser',adminController.validate('addUser'),adminController.addUser);
router.get('/getUser',adminController.getUser);
router.post('/resendOTP',adminController.resendOTP);
router.post('/blockUnblockUser',adminController.validate('blockUnblockUser'),adminController.blockUnblockUser);
router.delete('/deleteUser',adminController.validate('deleteUser'),adminController.deleteUser);

router.post('/uploadUserExcel',upload.single("file"),adminController.uploadUserExcel);
router.post('/uploadPDF',upload.single("file"),adminController.uploadPDF);


module.exports = router;