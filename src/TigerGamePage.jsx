import React from 'react';
    import { useNavigate } from 'react-router-dom';

    function TigerGamePage({ loggedInUser, onLogout }) {
      const navigate = useNavigate();

      const handleBackToModules = () => {
        navigate('/modules');
      };

      return (
        <div className="container">
          <h2>打老虎</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <p>打老虎模块正在开发中，敬请期待！</p>
          <button type="button" onClick={handleBackToModules} style={{ marginTop: '20px', backgroundColor: '#28a745' }}>返回模块选择</button>
        </div>
      );
    }

    export default TigerGamePage;
