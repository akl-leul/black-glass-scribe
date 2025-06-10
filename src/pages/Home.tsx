
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Calendar, User, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  likes_count: number;
  profiles: {
    username: string;
  } | null;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, posts]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          content,
          published_at,
          likes_count,
          user_id,
          profiles!posts_user_id_fkey (
            username
          )
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched posts:', data);
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to BlogSpace
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Discover amazing stories and share your thoughts with the world
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search posts, authors, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </GlassCard>

        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <GlassCard key={post.id} className="p-6 hover:bg-white/15 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link to={`/post/${post.id}`}>
                    <h2 className="text-2xl font-bold text-white hover:text-gray-300 transition-colors mb-2">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-gray-300 mb-4">{post.excerpt}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.profiles?.username || 'Anonymous'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(post.published_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {post.likes_count}
                  </div>
                  <Link to={`/post/${post.id}`}>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredPosts.length === 0 && posts.length > 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-300 text-lg">No posts found matching "{searchTerm}"</p>
            <Button 
              onClick={() => setSearchTerm('')}
              className="mt-4 bg-white text-black hover:bg-gray-200"
            >
              Clear Search
            </Button>
          </GlassCard>
        )}

        {posts.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-300 text-lg">No posts yet. Be the first to share your story!</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Home;
