
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Calendar, User, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface Post {
  id: number;
  title: string;
  content: string;
  published_at: string;
  likes_count: number;
  profiles: {
    username: string;
    bio: string;
  } | null;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  } | null;
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      if (user) checkIfLiked();
    }
  }, [id, user]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          published_at,
          likes_count,
          profiles!posts_user_id_fkey (
            username,
            bio
          )
        `)
        .eq('id', parseInt(id!))
        .eq('published', true)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles!comments_user_id_fkey (
            username
          )
        `)
        .eq('post_id', parseInt(id!))
        .eq('approved', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', parseInt(id!))
        .eq('user_id', user?.id)
        .single();

      if (data) setIsLiked(true);
    } catch (error) {
      // Not liked
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Please log in to like posts', variant: 'destructive' });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', parseInt(id!))
          .eq('user_id', user.id);
        setIsLiked(false);
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: parseInt(id!), user_id: user.id }]);
        setIsLiked(true);
      }
      fetchPost(); // Refresh to get updated likes count
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({ title: 'Please log in to comment', variant: 'destructive' });
      return;
    }

    if (!newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert([{
          post_id: parseInt(id!),
          user_id: user.id,
          content: newComment.trim(),
          author_name: user.email!, // Fallback
          author_email: user.email!,
          approved: true
        }]);

      setNewComment('');
      fetchComments();
      toast({ title: 'Comment added successfully!' });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: 'Error adding comment', variant: 'destructive' });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied to clipboard!' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Post not found</h1>
            <Link to="/">
              <Button className="bg-white text-black hover:bg-gray-200">
                Back to Home
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">{post.title}</h1>
          
          <div className="flex items-center justify-between mb-8 text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                <span>{post.profiles?.username || 'Anonymous'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{format(new Date(post.published_at), 'MMMM dd, yyyy')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleLike}
                variant="ghost"
                className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-400' : ''}`}
              >
                <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {post.likes_count}
              </Button>
              <Button
                onClick={handleShare}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Share2 className="h-5 w-5 mr-1" />
                Share
              </Button>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </div>
          
          {post.profiles?.bio && (
            <div className="mt-8 p-6 bg-white/5 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">About the Author</h3>
              <p className="text-gray-300">{post.profiles.bio}</p>
            </div>
          )}
        </GlassCard>

        {/* Comments Section */}
        <GlassCard className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            <MessageCircle className="inline h-6 w-6 mr-2" />
            Comments ({comments.length})
          </h2>
          
          {user && (
            <div className="mb-8">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 mb-4"
              />
              <Button
                onClick={handleComment}
                className="bg-white text-black hover:bg-gray-200"
              >
                Post Comment
              </Button>
            </div>
          )}
          
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-white font-medium">
                    {comment.profiles?.username || 'Anonymous'}
                  </span>
                  <span className="text-gray-400 ml-4 text-sm">
                    {format(new Date(comment.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </div>
            ))}
          </div>
          
          {comments.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default PostDetail;
