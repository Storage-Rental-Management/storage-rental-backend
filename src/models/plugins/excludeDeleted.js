module.exports = function excludeDeletedPlugin(schema, options = {}) {
  const deletedField = options.deletedField || 'isDeleted';
  const deletedValue = options.deletedValue !== undefined ? options.deletedValue : true;

  // Helper function to add the exclusion filter
  const addExclusionFilter = function() {
    const filter = this.getQuery();
    
    // Check if the deleted field is already in the query
    if (!filter.hasOwnProperty(deletedField)) {
      // Add the exclusion condition
      this.where({ [deletedField]: { $ne: deletedValue } });
    }
  };

  // Apply middleware to various find operations
  const operations = [
    'find',
    'findOne', 
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'countDocuments',
    'count',
    'distinct'
  ];

  operations.forEach(operation => {
    schema.pre(operation, addExclusionFilter);
  });

  // Handle aggregate operations
  schema.pre('aggregate', function() {
    const pipeline = this.pipeline();
    
    // Check if there's already a $match stage with the deleted field
    const hasDeletedMatch = pipeline.some(stage => 
      stage.$match && stage.$match.hasOwnProperty(deletedField)
    );
    
    if (!hasDeletedMatch) {
      // Add $match stage at the beginning
      this.pipeline().unshift({ 
        $match: { [deletedField]: { $ne: deletedValue } } 
      });
    }
  });

  // Add static methods for explicit control
  schema.statics.findWithDeleted = function(filter = {}, options = {}) {
    return this.find(filter, null, options);
  };

  schema.statics.findDeleted = function(filter = {}, options = {}) {
    return this.find({ ...filter, [deletedField]: deletedValue }, null, options);
  };

  schema.statics.findOneWithDeleted = function(filter = {}, options = {}) {
    return this.findOne(filter, null, options);
  };

  // Instance methods
  schema.methods.delete = function(callback) {
    this[deletedField] = deletedValue;
    return this.save(callback);
  };

  schema.methods.restore = function(callback) {
    this[deletedField] = !deletedValue;
    return this.save(callback);
  };
};