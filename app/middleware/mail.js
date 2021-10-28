const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

module.exports.mailfunctionWithAttachment = async (from, to, subject, message,mailData) => {
  // console.log("--- ENTER in mail function  ---" +from)
  // console.log("--- ENTER in mail function  ---" +message)
  // console.log("=== mailData ===")
  // console.log(mailData)
  try {      
    let transporter = nodemailer.createTransport({     
      host:"smtp.mail.us-east-1.awsapps.com",
      port: 465,
      auth: {      
        user:'lmpartnerportal@libertymutualinsurance.awsapps.com',
        pass:'BigApple#168'
      },
      secure:true,   
      debug: true,
      tls: {       
        rejectUnauthorized: false,
      },     
      pool: true,
      // maxConnections :1000  
      
    });
    
    const mailOptions = {
        from: from, // sender address
        // to:  to, // list of receiver  
        to:'nitin.shegal@mobileprogramming.com',
        // bcc: 'nitin.shegal@mobileprogramming.com',
        subject: subject, // Subject line
        html: message, // plain text body
        attachments: [
          {  
            filename: mailData.filename,				
            path: mailData.path				
          }
      ]
    };
   
    let rs =  await  transporter.sendMail(mailOptions);  
    console.log("++++++++++++++++ MAIL RESPONSE ++++++++++++++++++")  
    console.log(rs)
    return rs;
    // return { status: 1, message: "mail send" }
  } catch (error) {    
      return { status: 0, message: "mail not send" };
      
  }
}



module.exports.mailfunction = async (from, to, subject, message) => {
  try {   
    // console.log("-- enter in mailfunction  -------------")
    let transporter = nodemailer.createTransport({
      host:"smtp.mail.us-east-1.awsapps.com",
      port: 465,
      auth: {      
        user:'lmpartnerportal@libertymutualinsurance.awsapps.com',
        pass:'BigApple#168'
      },
      secure:true,   
      debug: true,
      tls: {       
        rejectUnauthorized: false,
      },     
      pool: true,
      maxConnections :1000   
    });

    const mailOptions = {
        from: from, // sender address
        // to:  to, // list of receiver      
        bcc: 'nitin.shegal@mobileprogramming.com',
        subject: subject, // Subject line
        html: message // plain text body
    };
    // console.log(mailOptions)
    let rs = await  transporter.sendMail(mailOptions);  
    console.log(rs) 
    transporter.close();
    return { status: 1, message: "mail send" }
  } catch (error) {     
      return { status: 0, message: "mail not send" };
      
  }
}


module.exports.mailfunctionSecond = async (from, to, subject, message) => {
  try {   

    console.log("-- enter in mailfunctionSecond -------------")
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: 'testing.mobileprogramming@gmail.com',
        pass: 'qwerty@123'
      },
      pool: true,
      maxConnections :1000,
      maxMessages :1000
      
    });
   
    const mailOptions = {
        from: from, // sender address
        // to:  to, // list of receiver      
        // bcc: 'nitin.shegal@mobileprogramming.com,rishav.tomer@mobileprogramming.com',
        subject: subject, // Subject line
        html: message // plain text body
    };
    console.log(mailOptions)
    let rs = await  transporter.sendMail(mailOptions);  
    console.log(rs) 
    transporter.close();
    // return rs
    return { status: 1, message: "mail send" }
  } catch (error) {     
      return { status: 0, message: "mail not send" };
      
  }
}