import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// 请求拦截器：自动添加 token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const fetchPosts = () => API.get('/posts');
export const fetchPost = (id) => API.get(`/posts/${id}`);
export const createPost = (formData) => API.post('/posts', formData);
export const login = (formData) => API.post('/login', formData);
export const register = (formData) => API.post('/register', formData);
export const addComment = (postId, content) => 
  API.post(`/posts/${postId}/comments`, { content });

export default API;