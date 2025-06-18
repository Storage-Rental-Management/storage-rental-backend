const { DOCUMENT_TYPES } = require('../../constants/databaseEnums');

module.exports = async (req, res) => {
  try {
    return res.success({ data: Object.values(DOCUMENT_TYPES) });
  } catch (error) {
    console.error('Get Document Types Error:', error);
    return res.internalServerError({ message: 'Failed to get document types' });
  }
};
