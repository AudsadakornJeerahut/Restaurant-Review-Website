const express = require('express');
const router = express.Router();
const { readJsonFile, writeJsonFile } = require('../utils/fileManager');
const { validateReview } = require('../middleware/validation');

// ========================================
// GET /api/reviews/:restaurantId
// ========================================
router.get('/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await readJsonFile('./backend/data/reviews.json');

    // ✅ กรองรีวิวเฉพาะร้านนี้
    const restaurantReviews = reviews.filter(
      (r) => Number(r.restaurantId) === Number(restaurantId)
    );

    // ✅ เรียงจากใหม่สุดไปเก่าสุด
    restaurantReviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      data: restaurantReviews,
      total: restaurantReviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรีวิว'
    });
  }
});

// ========================================
// POST /api/reviews
// ========================================
router.post('/', validateReview, async (req, res) => {
  try {
    const { restaurantId, userName, rating, comment, visitDate } = req.body;

    // ✅ อ่านข้อมูลปัจจุบัน
    const reviews = await readJsonFile('reviews.json');
    const restaurants = await readJsonFile('restaurants.json');
    
    console.log('restaurantId:', restaurantId);
    console.log('restaurants:', restaurants.map(r => r.id));

    // ✅ ตรวจสอบว่า restaurant ID มีอยู่จริงไหม
    const restaurant = restaurants.find(
      (r) => Number(r.id) === Number(restaurantId)
    );
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารนี้'
      });
    }

    // ✅ สร้างรีวิวใหม่
    const newReview = {
      id: Date.now(),
      restaurantId: Number(restaurantId),
      userName: userName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    // ✅ เพิ่มรีวิวและบันทึก
    reviews.push(newReview);
    await writeJsonFile('reviews.json', reviews);

    // ✅ อัปเดต averageRating และ totalReviews
    const restaurantReviews = reviews.filter(
      (r) => Number(r.restaurantId) === Number(restaurantId)
    );
    const totalRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = totalRating / restaurantReviews.length;

    const restaurantIndex = restaurants.findIndex(
      (r) => Number(r.id) === Number(restaurantId)
    );
    restaurants[restaurantIndex].averageRating = Math.round(newAverageRating * 10) / 10;
    restaurants[restaurantIndex].totalReviews = restaurantReviews.length;

    await writeJsonFile('restaurants.json', restaurants);

    res.status(201).json({
      success: true,
      message: 'เพิ่มรีวิวสำเร็จ',
      data: newReview,
      restaurant: {
        id: restaurants[restaurantIndex].id,
        name: restaurants[restaurantIndex].name,
        averageRating: restaurants[restaurantIndex].averageRating,
        totalReviews: restaurants[restaurantIndex].totalReviews
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มรีวิว'
    });
  }
});


module.exports = router;