const Counter = require('../models/counter');

const generateCode = async (prefix) => {
  try {
    // Find and update the counter
    const counter = await Counter.findOneAndUpdate(
      { name: prefix },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    // Generate the code with leading zeros
    const code = `${prefix}-${counter.count.toString().padStart(5, '0')}`;
    return code;
  } catch (error) {
    console.error(`Error generating ${prefix} code:`, error);
    throw error;
  }
};

module.exports = generateCode; 