const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

module.exports.mailfunctionWithAttachment = async (from, to, subject, message,mailData) => {
  try {  

    let transporter = nodemailer.createTransport({
      service: "gmail",		
      auth: {
        user: process.env.SENDER_EMAIL,
        pass:  process.env.SENDER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      } 
      
    });
    
    const mailOptions = {
        from: from, // sender address
        to:  to, // list of receiver      
        bcc: 'nitin.shegal@mobileprogramming.com',
        subject: subject, // Subject line
        html: message, // plain text body
        attachments: [
          {  
            filename: mailData.filename,				
            path: mailData.path				
          }
      ]
    };

    let info = await  transporter.sendMail(mailOptions);
    let cv_path = mailData.path
    if (fs.existsSync(cv_path)) {
      	fs.unlinkSync(cv_path)	
    }  
    return { status: 1, message: "mail send" }
  } catch (error) {
      console.log(error);
      return { status: 0, message: "mail not send" };
      
  }
}



module.exports.mailfunction = async (from, to, subject, message) => {
  try {   

    let transporter = nodemailer.createTransport({
      service: "gmail",		
      auth: {
        user: process.env.SENDER_EMAIL,
        pass:  process.env.SENDER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      } 
      
    });
    
    const mailOptions = {
        from: from, // sender address
        to:  to, // list of receiver      
        bcc: 'nitin.shegal@mobileprogramming.com,rishav.tomer@mobileprogramming.com',
        subject: subject, // Subject line
        html: message // plain text body
    };
     
    let info = await  transporter.sendMail(mailOptions);
    return { status: 1, message: "mail send" }
  } catch (error) {
      console.log(error);
      return { status: 0, message: "mail not send" };
      
  }
}
