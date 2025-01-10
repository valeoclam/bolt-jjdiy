import React from 'react';
    import { useNavigate } from 'react-router-dom';

    function AdminPage({ loggedInUser, onLogout }) {
      const navigate = useNavigate();

      const handleEditQuestionsClick = () => {
        navigate('/edit-questions');
      };

      return (
        <div className="container">
          <h2>后台管理</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <div className="module-list" style={{ width: '100%', maxWidth: '400px' }}>
            <button type="button" onClick={handleEditQuestionsClick} className="module-button edit-questions-button" style={{ padding: '20px', fontSize: '20px', backgroundColor: '#007bff' }}>懒人日记-问题库管理</button>
          </div>
        </div>
      );
    }

    export default AdminPage;
