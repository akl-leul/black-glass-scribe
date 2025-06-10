
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  status: string;
  created_at: string;
  likes_count: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserPosts();
  }, [user, navigate]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, status, created_at, likes_count')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        <GlassCard className="p-8 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
            <Link to="/create-post">
              <Button className="bg-white text-black hover:bg-gray-200">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </Link>
          </div>
        </GlassCard>

        <div className="grid gap-6">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      post.status === 'published' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {post.status}
                    </span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(post.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.likes_count} likes
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link to={`/edit-post/${post.id}`}>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deletePost(post.id)}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {posts.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-300 text-lg mb-4">You haven't created any posts yet.</p>
            <Link to="/create-post">
              <Button className="bg-white text-black hover:bg-gray-200">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </Link>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
