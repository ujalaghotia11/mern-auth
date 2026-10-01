const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(200).json({ searchedBrand: null, substitutes: [] });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Search by brand name OR salt name
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