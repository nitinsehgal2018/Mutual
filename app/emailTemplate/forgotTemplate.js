'user strict';
module.exports.forgotTemplate = async (data) => {
    const message = `
    <head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width">
  <title></title>
  <style type="text/css">
      
      body,
      #bodyTable {
          height: 100%!important;
          margin: 0;
          padding: 0;
          width: 100%!important
      }

      #bodyTable {
          font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
          min-height: 100%;
          background: #eee;
          color: #333
      }

      body,
      table,
      td,
      p,
      a,
      li,
      blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%
      }

      table,
      td {
          mso-table-lspace: 0;
          mso-table-rspace: 0
      }

      img {
          -ms-interpolation-mode: bicubic
      }

      body {
          margin: 0;
          padding: 0;
          background: #eee
      }

      img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: 0;
          text-decoration: none
      }

      table {
          border-collapse: collapse!important;
          max-width: 100%!important
      }

      img {
          border: 0!important
      }

      h1 {
          font-family: Helvetica;
          font-size: 42px;
          font-style: normal;
          font-weight: bold;
          text-align: center;
          margin: 30px auto 0
      }

      h2 {
          font-size: 32px;
          font-style: normal;
          font-weight: bold;
          margin: 50px auto 0
      }

      h3 {
          font-size: 20px;
          font-weight: bold;
          margin: 25px 0;
          letter-spacing: normal;
          text-align: left
      }

      a h3 {
          color: #444!important;
          text-decoration: none!important
      }

      .titleLink {
          text-decoration: none!important
      }

      .preheaderContent {
          color: #808080;
          font-size: 10px;
          line-height: 125%
      }

      .preheaderContent a:link,
      .preheaderContent a:visited,
      .preheaderContent a .yshortcuts {
          color: #606060;
          font-weight: normal;
          text-decoration: underline
      }

      #emailHeader,
      #tacoTip {
          color: #fff
      }

      #emailHeader {
          background-color: #FFDB50
      }

      #content p {
          color: #4d4d4d;
          margin: 20px 70px 30px;
          font-size: 16px;
          line-height: 28px;
          text-align: left
      }

      #button {
          display: inline-block;
          margin: 10px auto;
          background: #fff;
          border-radius: 4px;
          font-weight: bold;
          font-size: 18px;
          padding: 15px 20px;
          cursor: pointer;
          color: #0079bf;
          margin-bottom: 50px
      }

      #socialIconWrap img {
          line-height: 35px!important;
          padding: 0 5px
      }

      .footerContent div {
          color: #707070;
          font-family: Arial;
          font-size: 12px;
          line-height: 125%;
          text-align: center;
          max-width: 100%!important
      }

      .footerContent div a:link,
      .footerContent div a:visited {
          color: #369;
          font-weight: normal;
          text-decoration: underline
      }

      .footerContent img {
          display: inline
      }

      #socialLinks img {
          margin: 0 2px
      }

      #utility {
          border-top: 1px solid #ddd
      }

      #utility div {
          text-align: center
      }

      #monkeyRewards img {
          max-width: 160px
      }

      #emailFooter {
          max-width: 100%!important
      }

      #footerTwitter a,
      #footerFacebook a {
          text-decoration: none!important;
          color: #fff!important;
          font-size: 14px
      }

      #emailButton {
          border-radius: 6px;
          background: #70b500!important;
          margin: 0 auto 60px;
          box-shadow: 0 4px 0 #578c00
      }

      #socialLinks a {
          width: 40px
      }

      #socialLinks #blogLink {
          width: 80px!important
      }

      .sectionWrap {
          text-align: center
      }

      #header {
          color: #fff!important
      }

  </style>
</head>

<body>
  <table border="0" cellpadding="0" cellspacing="0" id="bodyTable" style="height:100%; width:100%">
      <tbody>
          <tr>
              <td align="center" valign="top">
                  <table align="center" border="0" cellspacing="0" id="emailContainer" style="width:600px">
                      <tbody>
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellpadding="0" cellspacing="0" id="templatePreheader" style="margin:15px 0 10px; width:100%">
                                      <tbody>
                                          <tr>
                                              <td>
                                                  <table align="left" border="0" cellspacing="0" style="width:50%">
                                                      <tbody>
                                                          <tr>
                                                              <td align="left" class="preheaderContent" mc:edit="preheader_content00" style="text-align:left!important;" valign="top">Welcome to Liberty Mutual</td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                                  <table align="left" border="0" cellspacing="0" style="width:50%">
                                                      <tbody>
                                                          <tr>
                                                              <td align="right" class="preheaderContent" mc:edit="preheader_content01" style="text-align:right!important;" valign="top"><a href="" target="_blank"></a>.</td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellpadding="0" cellspacing="0" class="sectionWrap" id="content" style="background:#FFFFFF; border-radius:4px; box-shadow:0px 3px 0px #DDDDDD; overflow:hidden; width:600px">
                                      <tbody>
                                          <tr>
                                              <td id="header" style="background-color:#FFDB50;color:#404040!important;" valign="top"><img alt="LibertyMutual Logo" src="${data.logo}" style="display:block;margin:40px auto 0;width:170px!important;" width="120">
                                                  <h1 style="font-size: 30px;">Welcome to Liberty Mutual</h1>
                                                  <p style="display:block;margin-bottom:50px;color:#FFFFFF;"></p>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td align="left" style="background:#FFFFFF;">
                                                  <br><br><p>
                                                  Dear <b>${data.first_name} </b>
                                                <br>                                                       
                                                <br> 
                                                Password Reset Confirmation.<br/>                                                 
                                                Your password is ${data.password}  <br/>
                                                Please click on the following link, or paste this into your browser to complete the process:<br/>
                                                ${data.url} <br/><br/>
                                                If you did not request this, please ignore this email and your password will remain unchanged
                                              </td>
                                          </tr>
                                          <tr>
                                             
                                        </tr>
                                        <tr>
                                            <td align="center" style="background:#FFFFFF;">
                                          </p></td>
                                          </tr>
                                         
                                         <tr>
                                            <td align="left" style="background:#FFFFFF;">
                                              <p>Sincerely,<br>Liberty Mutual
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td align="center" valign="top">
                                  <table align="center" border="0" cellpadding="10" cellspacing="0" id="emailFooter" style="width:600px">
                                      <tbody>
                                          <tr>
                                              <td class="footerContent" valign="top">
                                                  <table border="0" cellpadding="10" cellspacing="0" style="width:100%">
                                                      <tbody>
                                                          <tr>
                                                              <td valign="top">&nbsp;
                                                                  <div mc:edit="std_footer"><em>Copyright &copy; 2021 Liberty Mutual, All rights reserved.</em></div>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </td>
          </tr>
      </tbody>
  </table>
    </body>`

    return message;
}