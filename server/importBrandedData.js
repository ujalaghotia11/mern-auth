const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const Medicine = require('./models/Medicine'); 
require('dotenv').config();

const results = [];

// Kaggle / Custom Branded Medicines CSV Read karein
fs.createReadStream('./branded_medicines.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Dynamic Column Detection
    const keys = Object.keys(row);
    
    const brand = row.brandName || row.brand_name || row.Name || row.Brand || row.name || row[keys[0]];
    const salt = row.saltName || row.salt_name || row.generic_name || row.Composition || row.Generic || row.composition || row[keys[1]];
    const str = row.strength || row.Strength || row.dosage || 'Standard Dosage';
    
    let rawPrice = row.price || row.BrandPrice || row.mrp || row.Price || row[keys[2]];
    let prc = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

    if (brand && brand.trim()) {
      results.push({
        brandName: brand.trim(),
        saltName: salt ? salt.trim() : brand.trim(),
        strength: str ? str.trim() : 'Standard',
        price: prc,
        manufacturer: (row.manufacturer || row.Company || 'Pharma Brand').trim(),
        dosageForm: (row.dosageForm || row.form || row.Type || 'Tablet').trim(),
        isGeneric: false // Imp: Isse pta chalega ki ye branded medicine hai
      });
    }
  })
  .on('end', async () => {
    try {
      const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/dawaisaathi';
      await mongoose.connect(mongoURI);
      console.log('MongoDB Connected!');

      // DHYAN DEIN: Yahan deleteMany({}) NAHI chalayenge taaki puraana Jan Aushadhi generic data bacha rahe
      console.log('Inserting branded records into DB...');
      await Medicine.insertMany(results);

      console.log(`🎉 SUCCESS! ${results.length} Branded Medicines MongoDB mein ADD ho gayi hain!`);
      process.exit();
    } catch (error) {
      console.error('Import Error:', error.message);
      process.exit(1);
    }
  });