module.exports = function excludeDeletedPlugin(schema) {
  const excludeDeletedMiddleware = function (next) {
    const currentFilter = this.getFilter();
    if (!currentFilter.hasOwnProperty('isDeleted')) {
      this.setQuery({ ...currentFilter, isDeleted: false });
    }
    next();
  };

  schema.pre('find', excludeDeletedMiddleware);
  schema.pre('findOne', excludeDeletedMiddleware);
  schema.pre('findOneAndUpdate', excludeDeletedMiddleware);
  schema.pre('countDocuments', excludeDeletedMiddleware);
};
