const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const Medicine = require('./models/Medicine'); 
require('dotenv').config();

const results = [];

// Helper function to read CSV files
function readCSV(filePath, isGenericFlag) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Warning: ${filePath} file nahi mili, skipping...`);
      return resolve([]);
    }

    const items = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const keys = Object.keys(row);

        if (isGenericFlag) {
          // Jan Aushadhi Generic CSV Mapping
          const fullName = row['Generic Name'] || row.brandName || row.name || '';
          const mrpVal = parseFloat(row['MRP'] || row.price) || 10;

          if (fullName.trim()) {
            items.push({
              brandName: fullName.trim(),
              saltName: fullName.trim(),
              strength: row['Unit Size'] || 'Standard',
              price: mrpVal,
              manufacturer: 'Jan Aushadhi',
              dosageForm: row['Group Name'] || 'Tablet',
              isGeneric: true
            });
          }
        } else {
          // Kaggle Branded Medicines CSV Mapping
          const brand = row.brandName || row.brand_name || row.Name || row.Brand || row.name || row[keys[0]];
          const salt = row.saltName || row.salt_name || row.generic_name || row.Composition || row.Generic || row[keys[1]];
          const str = row.strength || row.Strength || row.dosage || 'Standard Dosage';
          let rawPrice = row.price || row.BrandPrice || row.mrp || row.Price || row[keys[2]];
          let prc = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

          if (brand && brand.trim()) {
            items.push({
              brandName: brand.trim(),
              saltName: salt ? salt.trim() : brand.trim(),
              strength: str ? str.trim() : 'Standard',
              price: prc,
              manufacturer: (row.manufacturer || row.Company || 'Pharma Brand').trim(),
              dosageForm: (row.dosageForm || row.form || row.Type || 'Tablet').trim(),
              isGeneric: false
            });
          }
        }
      })
      .on('end', () => resolve(items))
      .on('error', (err) => reject(err));
  });
}

async function importAllData() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/dawaisaathi';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');

    // 1. Read Jan Aushadhi Generic Data
    console.log('Reading Generic Medicines (medicines.csv)...');
    const genericItems = await readCSV('./medicines.csv', true);

    // 2. Read Kaggle Branded Data
    console.log('Reading Branded Medicines (branded_medicines.csv)...');
    const brandedItems = await readCSV('./branded_medicines.csv', false);

    const totalData = [...genericItems, ...brandedItems];

    if (totalData.length === 0) {
      console.log('❌ Kisi bhi CSV file se data read nahi ho paya.');
      process.exit(1);
    }

    // 3. Reset Collection & Insert All Data
    await Medicine.deleteMany({});
    await Medicine.insertMany(totalData);

    console.log(`\n🎉 SUCCESS! Full Import Completed!`);
    console.log(`- Generic Medicines: ${genericItems.length}`);
    console.log(`- Branded Medicines: ${brandedItems.length}`);
    console.log(`- Total DB Records: ${totalData.length}`);

    process.exit();
  } catch (error) {
    console.error('Import Error:', error.message);
    process.exit(1);
  }
}

importAllData();