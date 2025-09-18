const Documents = require('../../models/document'); 
const { DOCUMENT_TYPES } = require('../../constants/databaseEnums'); 

module.exports = async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await Documents.find({ userId }).sort({ createdAt: -1 });
    return res.success({ data: documents });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};