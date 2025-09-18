const Documents = require('../../models/document'); 

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Documents.findById(id);
    if (!document) return res.recordNotFound({ message: 'Document not found' });
    return res.success({ data: document });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};