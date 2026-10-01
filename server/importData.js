const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const Medicine = require('./models/Medicine'); 
require('dotenv').config();

const results = [];

fs.createReadStream('./medicines.csv')
  .pipe(csv())
  .on('data', (row) => {
    // CSV Columns: 'Generic Name', 'MRP', 'Unit Size', 'Group Name'
    const fullName = row['Generic Name'] || '';
    const mrpVal = parseFloat(row['MRP']) || 10;

    if (fullName.trim()) {
      results.push({
        brandName: fullName.trim(),      // Standard Generic Name
        saltName: fullName.trim(),       // Salt Composition
        strength: row['Unit Size'] || 'Standard',
        price: mrpVal,
        manufacturer: 'Jan Aushadhi',
        dosageForm: row['Group Name'] || 'Tablet'
      });
    }
  })
  .on('end', async () => {
    try {
      const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/dawaisaathi';
      await mongoose.connect(mongoURI);
      console.log('MongoDB Connected Successfully!');

      await Medicine.deleteMany({});
      await Medicine.insertMany(results);

      console.log(`🎉 SUCCESS! Total ${results.length} Jan Aushadhi Medicines Import Ho Gayi Hain!`);
      process.exit();
    } catch (error) {
      console.error('Import Error:', error.message);
      process.exit(1);
    }
  });