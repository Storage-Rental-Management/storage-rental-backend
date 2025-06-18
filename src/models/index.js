const mongoose = require('mongoose');
const StorageUnit = require('./storageUnit');

// Define a sample schema for a resource
const SampleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the model
const SampleModel = mongoose.model('Sample', SampleSchema);

module.exports = {
    SampleModel,
    StorageUnit
};