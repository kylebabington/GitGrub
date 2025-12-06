import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card, CardBody } from './Card';
import { MessageCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RecipeCommentsProps {
  recipeId: string;
}

export function RecipeComments({ recipeId }: RecipeCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('recipe_comments')
      .select('*, author:user_profiles!recipe_comments_author_id_fkey(*)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    setComments(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('recipe_comments')
        .insert({
          recipe_id: recipeId,
          author_id: user.id,
          content: newComment,
          rating,
        });

      if (error) throw error;

      setNewComment('');
      setRating(5);
      await loadComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading comments...</p>
      </div>
    );
  }

  const averageRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reviews & Comments
          </h2>
          {averageRating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(parseFloat(averageRating))
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {averageRating}
              </span>
              <span className="text-gray-600">
                ({comments.length} review{comments.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      </div>

      {user && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={
                          star <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 hover:text-yellow-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with this recipe..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Review'}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">
              No reviews yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-semibold">
                        {comment.author?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <a
                        href={`/${comment.author?.username}`}
                        className="font-semibold text-gray-900 hover:text-emerald-600"
                      >
                        {comment.author?.display_name || comment.author?.username}
                      </a>
                      <p className="text-sm text-gray-600">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>

                  {comment.rating && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= comment.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
