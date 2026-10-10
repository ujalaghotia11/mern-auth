const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

router.get('/search', async (req, res) => {
  try {
    const rawQuery = req.query.query;

    if (!rawQuery || rawQuery.trim() === '') {
      return res.status(200).json({ searchedBrand: null, substitutes: [] });
    }

    // 1. Clean up OCR noise (remove dosage like 650mg, numbers, and special symbols)
    const cleanedQuery = rawQuery
      .replace(/[0-9]+(\s*mg|\s*ml|\s*g)?/gi, '') // Removes "650mg", "500 mg", etc.
      .replace(/[^\w\s]/gi, '')                  // Removes punctuation/symbols
      .trim();

    // Fallback if cleaning leaves it completely empty
    const finalQueryTerm = cleanedQuery.length > 0 ? cleanedQuery : rawQuery.trim();

    const searchRegex = new RegExp(finalQueryTerm, 'i');

    // Search by brand name OR salt name using the cleaned query
    const searchedMedicines = await Medicine.find({
      $or: [
        { brandName: searchRegex },
        { saltName: searchRegex }
      ]
    }).limit(10);

    if (!searchedMedicines || searchedMedicines.length === 0) {
      return res.status(200).json({
        searchedBrand: null,
        substitutes: [],
        message: "No medicine found matching your query."
      });
    }

    const primaryMedicine = searchedMedicines[0];

    // Find generic substitutes
    const substitutes = await Medicine.find({
      saltName: new RegExp(`^${primaryMedicine.saltName}$`, 'i'),
      _id: { $ne: primaryMedicine._id }
    }).limit(5);

    const formattedSubstitutes = substitutes.map(sub => {
      const brandPrice = primaryMedicine.price || 0;
      const genericPrice = sub.price || 0;
      const savingsAmount = brandPrice - genericPrice;
      const savingsPercentage = brandPrice > 0 ? ((savingsAmount / brandPrice) * 100).toFixed(1) : 0;

      return {
        ...sub._doc,
        savingsAmount: savingsAmount > 0 ? savingsAmount : 0,
        savingsPercentage: savingsPercentage > 0 ? `${savingsPercentage}%` : "0%"
      };
    });

    return res.status(200).json({
      searchedBrand: primaryMedicine,
      saltName: primaryMedicine.saltName,
      strength: primaryMedicine.strength,
      substitutes: formattedSubstitutes,
      allMatches: searchedMedicines
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;