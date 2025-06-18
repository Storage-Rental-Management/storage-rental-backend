const responseCode = {
    success: 200,
    badRequest: 400,
    internalServerError: 500,
    unAuthorized: 401,
    notFound: 404,
    validationError: 422,
};

const responseStatus = {
    success: 'SUCCESS',
    failure: 'FAILURE',
    serverError: 'SERVER_ERROR',
    badRequest: 'BAD_REQUEST',
    recordNotFound: 'RECORD_NOT_FOUND',
    validationError: 'VALIDATION_ERROR',
    unauthorized: 'UNAUTHORIZED',
};

module.exports = { responseCode, responseStatus };
