const bookmarkService = require('../services/bookmark/bookmarkService');

// Bookmark/Un-bookmark Property
const bookmarkProperty = async (req, res) => {
  try {
    await bookmarkService.bookmarkProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const unBookmarkProperty = async (req, res) => {
  try {
    await bookmarkService.unBookmarkProperty(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Bookmark/Un-bookmark Unit
const bookmarkUnit = async (req, res) => {
  try {
    await bookmarkService.bookmarkUnit(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const unBookmarkUnit = async (req, res) => {
  try {
    await bookmarkService.unBookmarkUnit(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

// Get Bookmarked Properties/Units
const getBookmarkedProperties = async (req, res) => {
  try {
    await bookmarkService.getBookmarkedProperties(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getBookmarkedUnits = async (req, res) => {
  try {
    await bookmarkService.getBookmarkedUnits(req, res);
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
}

module.exports = {
  bookmarkProperty,
  unBookmarkProperty,
  bookmarkUnit,
  unBookmarkUnit,
  getBookmarkedProperties, 
  getBookmarkedUnits,
};
