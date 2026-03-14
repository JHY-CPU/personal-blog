import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { createPost } from '../utils/api';

function CreatePost({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // 未登录时跳转
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('title', formData.title);
    form.append('summary', formData.summary);
    form.append('content', formData.content);
    if (coverImage) {
      form.append('cover', coverImage);
    }

    try {
      await createPost(form);
      navigate('/');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">写文章</h1>
      
      {/* 切换按钮 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPreview(false)}
          className={`px-4 py-2 rounded ${!preview ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          编辑
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`px-4 py-2 rounded ${preview ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          预览
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 标题 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">标题</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="input-field"
            required
          />
        </div>

        {/* 摘要 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">摘要（选填）</label>
          <input
            type="text"
            value={formData.summary}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
            className="input-field"
          />
        </div>

        {/* 封面图 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">封面图（选填）</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            className="w-full"
          />
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">内容 (支持 Markdown)</label>
          {!preview ? (
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows="15"
              className="input-field font-mono"
              required
            />
          ) : (
            <div className="prose max-w-none p-4 border rounded-lg bg-white min-h-[400px]">
              <ReactMarkdown>{formData.content || '*暂无内容*'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布文章'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;