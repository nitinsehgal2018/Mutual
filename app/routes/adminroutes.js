var express = require('express');
var router = express.Router();
const adminController = require('../controller/adminController');
const is_admin = require('../middleware/is_admin');
const is_superadmin = require('../middleware/is_super');
const is_manager = require('../middleware/is_manager');
const is_all = require('../middleware/is_all');
const check_token_exits = require('../middleware/check_token');
const upload = require("../middleware/upload");
const valid_recruiter = require('../middleware/valid_recruiter');
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
router.delete('/deleteAllUser',adminController.deleteAllUser);
router.post('/uploadUserExcel',upload.single("file"),adminController.uploadUserExcel);
router.post('/uploadPDF',upload.single("file"),adminController.uploadPDF);


router.post('/uploadUserBulk',upload.single("file"),adminController.uploadUserBulk);
router.get('/sendInvitationUser',adminController.sendInvitationUser);
router.get('/updateInvitationUser',adminController.updateInvitationUser);
router.get('/updateSiteAccess',adminController.updateSiteAccess);


/** **********************************************************************
 *        List of Super admin and Admin Related  Routes likes add admin 
 **************************************************************************/
router.post('/addSuperAdmin',adminController.validate('addSuperAdmin'),adminController.addSuperAdmin);

router.get('/getDepartment',check_token_exits,is_superadmin,adminController.getDepartment);
router.post('/addAdmin',check_token_exits,is_superadmin,adminController.validate('addAdmin'),adminController.addAdmin);
router.post('/blockUnblockAdmin',check_token_exits,is_superadmin,adminController.validate('blockUnblockAdmin'),adminController.blockUnblockAdmin);
router.post('/resetAdminPassword',check_token_exits,is_superadmin,adminController.validate('resetAdminPassword'),adminController.resetAdminPassword);
router.delete('/deleteAdmin',check_token_exits,is_superadmin,adminController.validate('deleteAdmin'),adminController.deleteAdmin);
router.get('/getAdmin',check_token_exits,is_superadmin,adminController.validate('getAdmin'),adminController.getAdmin);
router.put('/updateAdmin',check_token_exits,is_superadmin,adminController.validate('updateAdmin'),adminController.updateAdmin);


/** **********************************************************************
 *        List of Partners related routes
 **************************************************************************/
router.post('/addPartner',check_token_exits,is_all,adminController.addPartner);
router.put('/updatePartner',check_token_exits,is_all,adminController.validate('updatePartner'),adminController.updatePartner);
router.delete('/deletePartner',check_token_exits,is_all,adminController.validate('deletePartner'),adminController.deletePartner);
router.get('/getPartner',check_token_exits,is_all,adminController.getPartner);
router.get('/getAllPartner',check_token_exits,is_all,adminController.getAllPartner);
router.post('/assignUserToPartner',check_token_exits,is_all,adminController.assignUserToPartner);
router.put('/updateUser',check_token_exits,is_all,adminController.validate('updateUser'),adminController.updateUser);
router.delete('/deleteUser',check_token_exits,is_all,adminController.validate('deleteUser'),adminController.deleteUser);
router.post('/changeBlockStatus',check_token_exits,is_all,adminController.validate('changeBlockStatus'),adminController.changeBlockStatus);
router.post('/changePrimaryContactStatus',check_token_exits,is_all,adminController.validate('changePrimaryContactStatus'),adminController.changePrimaryContactStatus);
router.post('/changeManagerStatus',check_token_exits,is_all,adminController.validate('changeManagerStatus'),adminController.changeManagerStatus);


/** **********************************************************************
 *        List of Manager and Non manager routes
 **************************************************************************/
router.post('/addUserByManager',check_token_exits,is_all,adminController.addUserByManager);
router.put('/updateUserByManager',check_token_exits,adminController.validate('updateUserByManager'),adminController.updateUserByManager);
router.get('/getUserByManager',check_token_exits,is_manager,adminController.getUserByManager);
router.post('/changeBlockStatusByManager',check_token_exits,is_manager,adminController.validate('changeBlockStatusByManager'),adminController.changeBlockStatusByManager);
router.post('/changeManagerStatusByManager',check_token_exits,is_manager,adminController.validate('changeManagerStatusByManager'),adminController.changeManagerStatusByManager);


router.get('/getProfile',check_token_exits,adminController.getProfile);
router.put('/updateProfile',check_token_exits,adminController.validate('updateProfile'),adminController.updateProfile);
router.post('/changePassword',check_token_exits,is_all,adminController.validate('changePassword'),adminController.changePassword);

router.post('/forgotPassword',adminController.validate('forgotpass'),adminController.forgotPassword);
router.post('/resetForgotPassword',adminController.validate('resetForgotPassword'),adminController.resetForgotPassword);


/** **********************************************************************
 *        List of Extra routes
 **************************************************************************/
router.get('/getClient',adminController.getClient);
router.post('/blockSiteAccess',adminController.blockSiteAccess);
router.post('/blockUnblockClient',adminController.validate('blockUnblockClient'),adminController.blockUnblockClient);
router.delete('/deleteClient',adminController.validate('deleteClient'),adminController.deleteClient);
router.post('/resendClientInvitation',adminController.resendClientInvitation);
router.put('/updateAnyUser',adminController.updateAnyUser);
router.get('/dashboard',adminController.dashboard);



// EXTRA Routes
router.post('/readJson',upload.single("file"),adminController.readJson);
router.post('/testMail',adminController.testMail);
router.post('/encryptData',adminController.encryptData);

module.exports = router;