const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

module.exports.mailfunctionWithAttachment = async (from, to, subject, message,mailData) => {
  // console.log("--- Enter in mailfunction mail js --")
  // console.log(mailData);
  try {
   

    var transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,    
      auth: {
          user: "noreply.mobileprogramming@gmail.com",
          pass: "noreply@1234"
      }
    });

    // let transporter2 = nodemailer.createTransport({
    //   service: "gmail",		
    //   auth: {
    //     user: "testing.mobileprogramming@gmail.com",
    //     pass: "qwerty@123"
    //   },
    //   tls: {
    //     rejectUnauthorized: false
    //   } 
      
    // });
   
    const mailOptions = {
        from: from, // sender address
        to: 'pulkit.chowdhry@mobileprogramming.com, praveen.chand@mobileprogramming.com', // list of receivers
        // cc: 'pulkit.chowdhry@mobileprogramming.com',
        // bcc: 'nitin.shegal@mobileprogramming.com',
        subject: subject, // Subject line
        html: message,// plain text body
        attachments: [
          {  
            filename: mailData.filename,				
            path: mailData.path				
          }
      ]
    };
    let info = await  transporter.sendMail(mailOptions);
    let cv_path = mailData.path
    // console.log("cv_path"+cv_path);
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
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,    
        auth: {
            user: "noreply.mobileprogramming@gmail.com",
            pass: "noreply@1234"
        }
    });

    let transporter2 = nodemailer.createTransport({
      service: "gmail",		
      auth: {
        user: "testing.mobileprogramming@gmail.com",
        pass: "qwerty@123"
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
        html: message // plain text body
    };
    
   
    let info = await  transporter2.sendMail(mailOptions);
    console.log(info)
    return { status: 1, message: "mail send" }
  } catch (error) {
      console.log(error);
      return { status: 0, message: "mail not send" };
      
  }
}
