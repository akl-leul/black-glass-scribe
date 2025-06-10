
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Save, Send } from 'lucide-react';

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (publish: boolean) => {
    if (!user) {
      toast({ title: 'You must be logged in to create a post', variant: 'destructive' });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.substring(0, 150) + '...',
        user_id: user.id,
        published: publish,
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
        author_id: 1 // Temporary fallback for existing schema
      };

      const { error } = await supabase
        .from('posts')
        .insert([postData]);

      if (error) throw error;

      toast({ 
        title: publish ? 'Post published successfully!' : 'Draft saved successfully!' 
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error saving post',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Post</h1>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter your post title"
              />
            </div>
            
            <div>
              <Label htmlFor="excerpt" className="text-white">Excerpt (Optional)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                placeholder="Brief description of your post"
              />
            </div>
            
            <div>
              <Label htmlFor="content" className="text-white">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[400px]"
                placeholder="Write your post content here..."
              />
            </div>
            
            <div className="flex space-x-4">
              <Button
                onClick={() => handleSave(false)}
                disabled={loading}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default CreatePost;
