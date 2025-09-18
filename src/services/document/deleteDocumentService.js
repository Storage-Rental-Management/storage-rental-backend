const Documents = require('../../models/document'); 

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Documents.findByIdAndDelete(id);
    if (!deleted) return res.recordNotFound({ message: 'Document not found' });
    return res.success({ message: 'Document deleted successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};