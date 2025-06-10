
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Users, FileText, Trash2, Eye } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface AdminPost {
  id: number;
  title: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  } | null;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      fetchUsers();
      fetchPosts();
      toast({ title: 'Welcome Admin!' });
    } else {
      toast({ title: 'Invalid credentials', variant: 'destructive' });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profilesError) throw profilesError;

      const usersWithProfiles = authUsers.users.map(user => ({
        id: user.id,
        username: profiles?.find(p => p.id === user.id)?.username || 'No username',
        email: user.email || 'No email',
        created_at: user.created_at
      }));

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error fetching users', variant: 'destructive' });
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          status,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ title: 'Error fetching posts', variant: 'destructive' });
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      toast({ title: 'Post deleted successfully!' });
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error deleting post',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <GlassCard className="p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-white text-center mb-8">Admin Portal</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter admin username"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              Login to Admin Portal
            </Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        <GlassCard className="p-8 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back to Site
              </Button>
              <Button
                onClick={() => setIsAuthenticated(false)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </GlassCard>

        <div className="flex space-x-4 mb-8">
          <Button
            onClick={() => setActiveTab('users')}
            variant={activeTab === 'users' ? 'default' : 'outline'}
            className={activeTab === 'users' ? 'bg-white text-black' : 'border-white/20 text-white hover:bg-white/10'}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users ({users.length})
          </Button>
          <Button
            onClick={() => setActiveTab('posts')}
            variant={activeTab === 'posts' ? 'default' : 'outline'}
            className={activeTab === 'posts' ? 'bg-white text-black' : 'border-white/20 text-white hover:bg-white/10'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Manage Posts ({posts.length})
          </Button>
        </div>

        {activeTab === 'users' && (
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{user.username}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                    <p className="text-gray-400 text-sm">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-400 text-center py-8">No users found.</p>
              )}
            </div>
          </GlassCard>
        )}

        {activeTab === 'posts' && (
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Post Management</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{post.title}</h3>
                    <p className="text-gray-400 text-sm">
                      By: {post.profiles?.username || 'Unknown'} • 
                      Status: <span className={`capitalize ${post.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {post.status}
                      </span> • 
                      Created: {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => navigate(`/post/${post.id}`)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deletePost(post.id)}
                      disabled={loading}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-gray-400 text-center py-8">No posts found.</p>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Admin;
