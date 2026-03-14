import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchPost, addComment } from '../utils/api';

function Post({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const { data } = await fetchPost(id);
      setPost(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await addComment(id, comment);
      setComment('');
      loadPost(); // 重新加载文章获取新评论
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  if (!post) {
    return <div className="text-center py-10">文章不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 文章头部 */}
      <div className="mb-8">
        {post.cover_image && (
          <img 
            src={`http://localhost:5000${post.cover_image}`} 
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-6"
          />
        )}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>👤 {post.username}</span>
          <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
          <span>👁️ {post.views} 阅读</span>
        </div>
      </div>

      {/* 文章内容 */}
      <div className="prose prose-lg max-w-none mb-12">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* 评论区 */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">评论 ({post.comments?.length || 0})</h2>
        
        {/* 评论表单 */}
        <form onSubmit={handleComment} className="mb-8">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "写下你的评论..." : "请先登录后评论"}
            rows="4"
            className="input-field mb-3"
            required
            disabled={!user}
          />
          <button
            type="submit"
            disabled={!user || submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>

        {/* 评论列表 */}
        <div className="space-y-4">
          {post.comments?.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{comment.username}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Post;