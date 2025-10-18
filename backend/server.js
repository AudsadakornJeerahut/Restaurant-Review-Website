const express = require('express'); 
const cors = require('cors');
require('dotenv').config();

const restaurantRoutes = require('./routes/restaurants');
const reviewRoutes = require('./routes/reviews');

const { readJsonFile } = require('./utils/fileManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🍜 Restaurant Review API',
    version: '1.0.0',
    endpoints: {
      restaurants: '/api/restaurants',
      reviews: '/api/reviews',
      stats: '/api/stats'
    }
  });
});

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reviews', require('./routes/reviews'));


// ========================================
// ✅ GET /api/stats - ดึงสถิติทั้งหมด
// ========================================
app.get('/api/stats', async (req, res) => {
  try {
    // อ่านข้อมูล
    const restaurants = await readJsonFile('./backend/data/restaurants.json');
    const reviews = await readJsonFile('./backend/data/reviews.json');

    // จำนวนร้านทั้งหมด
    const totalRestaurants = restaurants.length;

    // จำนวนรีวิวทั้งหมด
    const totalReviews = reviews.length;

    // ถ้ามีรีวิว ให้คำนวณคะแนนเฉลี่ย
    let averageRating = 0;
    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      averageRating = (totalRating / totalReviews).toFixed(1);
    }

    // คำนวณคะแนนเฉลี่ยของแต่ละร้าน
    const restaurantRatings = restaurants.map(r => {
      const rReviews = reviews.filter(rv => rv.restaurantId === r.id);
      const avg = rReviews.length > 0 
        ? rReviews.reduce((sum, rv) => sum + rv.rating, 0) / rReviews.length
        : 0;
      return {
        ...r,
        averageRating: Number(avg.toFixed(1))
      };
    });

    // หาร้าน top 5
    const topRatedRestaurants = [...restaurantRatings]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // ส่งข้อมูลกลับ
    res.json({
      success: true,
      data: {
        totalRestaurants,
        totalReviews,
        averageRating: Number(averageRating),
        topRatedRestaurants
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติ'
    });
  }
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});