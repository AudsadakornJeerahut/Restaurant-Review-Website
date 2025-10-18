const express = require('express');
const router = express.Router();
const { readJsonFile } = require('../utils/fileManager');

// ========================================
// GET /api/restaurants - ดึงรายการร้านทั้งหมด (พร้อม filtering)
// ========================================
router.get('/', async (req, res) => {
  try {
    let restaurants = await readJsonFile('restaurants.json');
    const { search, category, minRating, priceRange } = req.query;

    // กรองตามชื่อ
    if (search) {
      const searchLower = search.toLowerCase();
      restaurants = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    // กรองตามหมวดหมู่
    if (category) {
      restaurants = restaurants.filter(
        r => r.category.toLowerCase() === category.toLowerCase()
      );
    }

    // กรองตามคะแนนขั้นต่ำ
    if (minRating) {
      const min = parseFloat(minRating);
      restaurants = restaurants.filter(r => r.averageRating >= min);
    }

    // กรองตามช่วงราคา
    if (priceRange) {
      const price = parseInt(priceRange, 10);
      restaurants = restaurants.filter(r => r.priceRange === price);
    }

    res.json({
      success: true,
      data: restaurants,
      total: restaurants.length,
      filters: {
        search: search || null,
        category: category || null,
        minRating: minRating || null,
        priceRange: priceRange || null
      }
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้าน'
    });
  }
});

// ========================================
// GET /api/restaurants/:id - ดึงข้อมูลร้านตาม ID พร้อมรีวิว
// ========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = Number(id); // ✅ ปรับให้เป็น Number แทน parseInt

    if (isNaN(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'ID ร้านไม่ถูกต้อง'
      });
    }

    const restaurants = await readJsonFile('restaurants.json');
    const reviews = await readJsonFile('reviews.json');

    // ✅ ปรับให้ใช้ Number() ทั้งสองฝั่ง เพื่อความแน่นอน
    const restaurant = restaurants.find(r => Number(r.id) === restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารนี้'
      });
    }

    // ✅ ปรับตรงนี้ด้วย
    const restaurantReviews = reviews
      .filter(r => Number(r.restaurantId) === restaurantId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        ...restaurant,
        reviews: restaurantReviews
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้าน'
    });
  }
});

module.exports = router;