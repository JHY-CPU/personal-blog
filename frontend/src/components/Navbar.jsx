import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600">
            📝 个人博客
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/create" className="btn-primary">
                  写文章
                </Link>
                <span className="text-gray-600">你好，{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  登录
                </Link>
                <Link to="/register" className="btn-secondary">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;