const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

const getMulterStorage = (folderName = "others") => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const folder = `uploads/${folderName}`;
      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: function (req, file, cb) {
      let ext = path.extname(file.originalname);
      if (!ext || ext === ".bin") {
        if (file.mimetype === "application/octet-stream") {
          ext = ".png"; 
        } else {
          ext = "." + (mime.extension(file.mimetype) || "bin");
        }
      }
      const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`;

      cb(null, uniqueName);
    },
  });
};

const getUploader = (folderName) =>
  multer({ storage: getMulterStorage(folderName) });

module.exports = getUploader;
