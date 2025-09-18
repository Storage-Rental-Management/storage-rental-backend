const User = require('../../models/user');

exports.bookmarkProperty = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { $addToSet: { bookmarkedProperties: propertyId } }, { new: true }).populate('bookmarkedProperties');
    res.success({ message: 'Property bookmarked', data: user.bookmarkedProperties });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

exports.unBookmarkProperty = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { $pull: { bookmarkedProperties: propertyId } }, { new: true }).populate('bookmarkedProperties');
    res.success({ message: 'Property un-bookmarked', data: user.bookmarkedProperties });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

exports.bookmarkUnit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unitId } = req.params;
    const user = await User.findByIdAndUpdate( userId, { $addToSet: { bookmarkedUnits: unitId } }, { new: true }).populate('bookmarkedUnits');
    res.success({ message: 'Unit bookmarked', data: user.bookmarkedUnits });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

exports.unBookmarkUnit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unitId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { $pull: { bookmarkedUnits: unitId } }, { new: true }).populate('bookmarkedUnits');
    res.success({ message: 'Unit un-bookmarked', data: user.bookmarkedUnits });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

exports.getBookmarkedProperties = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarkedProperties');
    res.success({ message: 'List of bookmarked properties', data: user.bookmarkedProperties });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

exports.getBookmarkedUnits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarkedUnits');
    res.success({ message: 'List of bookmarked units', data: user.bookmarkedUnits });
  } catch (error) {
    res.internalServerError({ message: error.message });
  }
};

