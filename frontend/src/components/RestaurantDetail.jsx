import { useState, useEffect } from 'react';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import { getRestaurantById } from '../services/api';

function RestaurantDetail({ restaurantId, onBack }) {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (restaurantId) {
            fetchRestaurantDetail();
        }
    }, [restaurantId]);

    const fetchRestaurantDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getRestaurantById(restaurantId);
            console.log('📡 Result from API:', result);

            if (result.success) {
                setRestaurant(result.data);
            } else {
                throw new Error(result.message || 'ข้อมูลร้านไม่ถูกต้อง');
            }
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถโหลดข้อมูลร้านได้');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewAdded = () => {
        // refresh ข้อมูลร้านหลังจากเพิ่มรีวิวใหม่
        fetchRestaurantDetail();
    };

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!restaurant) return <div className="error">ไม่พบร้านอาหาร</div>;

    return (
        <div className="restaurant-detail">
            <button className="back-button" onClick={onBack}>
                ← กลับ
            </button>

            <div className="detail-header">
                <img src={restaurant.image} alt={restaurant.name} />
                <div className="detail-info">
                    <h1>{restaurant.name}</h1>
                    <p className="category">{restaurant.category}</p>
                    <p className="description">{restaurant.description}</p>
                    <div className="info-row">
                        <span>📍 {restaurant.location}</span>
                        <span>📞 {restaurant.phone}</span>
                        <span>🕐 {restaurant.openHours}</span>
                    </div>
                    <div className="rating-info">
                        <span className="rating">
                            ⭐ {restaurant.averageRating > 0
                                ? restaurant.averageRating.toFixed(1)
                                : 'ยังไม่มีรีวิว'}
                        </span>
                        <span className="price">{'฿'.repeat(restaurant.priceRange)}</span>
                        <span className="total-reviews">({restaurant.totalReviews} รีวิว)</span>
                    </div>
                </div>
            </div>

            <ReviewForm
                restaurantId={restaurantId}
                onReviewAdded={handleReviewAdded}
            />

            <ReviewList reviews={restaurant.reviews || []} />
        </div>
    );
}

export default RestaurantDetail;