const multer = require("multer");

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};

var storage = multer.diskStorage({    
  destination: (req, file, cb) => {  
    cb(null, __dirname  + "../../../uploads/");
  },
  filename: (req, file, cb) => { 
    cb(null, `${Date.now()}-mpllc-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage,  limits: { fileSize: 8000000 }
});
// var uploadFile = multer({ storage: storage, fileFilter: excelFilter });
module.exports = uploadFile;