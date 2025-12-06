import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RecipeRatingsProps {
  recipeId: string;
  averageRating: number;
  ratingCount: number;
  onRatingUpdate: () => void;
}

export function RecipeRatings({
  recipeId,
  averageRating,
  ratingCount,
  onRatingUpdate,
}: RecipeRatingsProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [myRating, setMyRating] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [recipeId, user]);

  const loadRatings = async () => {
    const { data } = await supabase
      .from('recipe_ratings')
      .select('*, user:user_profiles(*)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    setRatings(data || []);

    if (user) {
      const userRating = data?.find((r) => r.user_id === user.id);
      setMyRating(userRating);
      if (userRating) {
        setSelectedRating(userRating.rating);
        setReviewText(userRating.review_text || '');
      }
    }
  };

  const submitRating = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    if (myRating) {
      const { error } = await supabase
        .from('recipe_ratings')
        .update({
          rating: selectedRating,
          review_text: reviewText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', myRating.id);

      if (!error) {
        setShowRatingModal(false);
        loadRatings();
        onRatingUpdate();
      }
    } else {
      const { error } = await supabase.from('recipe_ratings').insert({
        recipe_id: recipeId,
        user_id: user.id,
        rating: selectedRating,
        review_text: reviewText,
      });

      if (!error) {
        setShowRatingModal(false);
        loadRatings();
        onRatingUpdate();
      }
    }

    setLoading(false);
  };

  const deleteRating = async () => {
    if (!myRating || !confirm('Delete your rating?')) return;

    const { error } = await supabase
      .from('recipe_ratings')
      .delete()
      .eq('id', myRating.id);

    if (!error) {
      setShowRatingModal(false);
      setMyRating(null);
      setSelectedRating(5);
      setReviewText('');
      loadRatings();
      onRatingUpdate();
    }
  };

  const renderStars = (rating: number, size: number = 20, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-2xl font-bold text-gray-900">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
          </p>
        </div>

        <Button onClick={() => setShowRatingModal(true)}>
          <Star size={16} className="mr-2" />
          {myRating ? 'Update Rating' : 'Rate Recipe'}
        </Button>
      </div>

      {ratings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Reviews</h3>
          {ratings.map((rating) => (
            <div key={rating.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {rating.user?.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(rating.rating, 16)}
                    <span className="text-xs text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {rating.review_text && (
                <p className="text-gray-700 text-sm mt-2">{rating.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showRatingModal && (
        <Modal onClose={() => setShowRatingModal(false)}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {myRating ? 'Update Your Rating' : 'Rate This Recipe'}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {renderStars(selectedRating, 32, true)}
                <span className="text-lg font-semibold text-gray-900 ml-2">
                  {selectedRating} {selectedRating === 1 ? 'star' : 'stars'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this recipe..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={submitRating} disabled={loading}>
                {loading ? 'Saving...' : myRating ? 'Update' : 'Submit'}
              </Button>
              {myRating && (
                <Button variant="secondary" onClick={deleteRating}>
                  Delete
                </Button>
              )}
              <Button variant="ghost" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
