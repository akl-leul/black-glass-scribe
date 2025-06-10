
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPost, setFetchingPost] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPost();
  }, [user, id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', parseInt(id!))
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setExcerpt(data.excerpt);
      setContent(data.content);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({ title: 'Error fetching post', variant: 'destructive' });
      navigate('/dashboard');
    } finally {
      setFetchingPost(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          excerpt,
          content,
          published: publish,
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(id!))
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ 
        title: publish ? 'Post published successfully!' : 'Post updated successfully!' 
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error updating post',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">Loading post...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Edit Post</h1>
          
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter your post title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="excerpt" className="text-white">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Brief description of your post"
                rows={3}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content" className="text-white">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Write your post content here..."
                rows={15}
                required
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200"
              >
                {loading ? 'Publishing...' : 'Update & Publish'}
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default EditPost;
