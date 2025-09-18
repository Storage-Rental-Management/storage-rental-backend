const { responseCode } = require("../constants/responseConstants.js");
const responseBody = require("../resources/response.js");

const responseHandler = (req, res, next) => {
  res.success = (data = {}) => {
    if (!res.headersSent) {
      res.status(responseCode.success).json(responseBody.success(data));
    }
  };

  res.failure = (data = {}) => {
    if (!res.headersSent) {
      res.status(responseCode.badRequest).json(responseBody.failure(data));
    }
  };

  res.internalServerError = (data = {}) => {
    if (!res.headersSent) {
      res
        .status(responseCode.internalServerError)
        .json(responseBody.internalServerError(data));
    }
  };

  res.badRequest = (data = {}) => {
    if (!res.headersSent) {
      res.status(responseCode.badRequest).json(responseBody.badRequest(data));
    }
  };

  res.recordNotFound = (data = {}) => {
    if (!res.headersSent) {
      res.status(responseCode.notFound).json(responseBody.recordNotFound(data));
    }
  };
  
  res.notFound = (data = {}) => {
    if (!res.headersSent) {
      res.status(responseCode.notFound).json(responseBody.recordNotFound(data));
    }
  };

  res.validationError = (data = {}) => {
    if (!res.headersSent) {
      res
        .status(responseCode.validationError)
        .json(responseBody.validationError(data));
    }
  };

  res.unAuthorized = (data = {}) => {
    if (!res.headersSent) {
      res
        .status(responseCode.unAuthorized)
        .json(responseBody.unAuthorized(data));
    }
  };

  next();
};

module.exports = responseHandler;