exports.tryCatch = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  }
};

exports.throwError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};