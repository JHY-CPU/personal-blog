import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../utils/api';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data } = await fetchPosts();
      setPosts(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-800 mb-8">最新文章</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-10">暂无文章</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link to={`/post/${post.id}`} key={post.id}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
                {post.cover_image && (
                  <img 
                    src={`http://localhost:5000${post.cover_image}`} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.summary || post.content.substring(0, 150) + '...'}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>👤 {post.username}</span>
                    <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>👁️ {post.views} 阅读</span>
                    <span>💬 {post.comment_count || 0} 评论</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;