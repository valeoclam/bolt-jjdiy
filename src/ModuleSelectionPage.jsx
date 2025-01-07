import React from 'react';
    import { useNavigate } from 'react-router-dom';

    function ModuleSelectionPage({ loggedInUser, onLogout }) {
      const navigate = useNavigate();

      const handleInspirationClick = () => {
        navigate('/inspiration');
      };

      const handleTigerGameClick = () => {
        navigate('/tiger-game');
      };

      return (
        <div className="container">
          <h2>模块选择</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <button type="button" onClick={onLogout} className="logout-button">退出</button>
          <div className="module-list">
            <button type="button" onClick={handleInspirationClick} className="module-button">灵感记录</button>
            <button type="button" onClick={handleTigerGameClick} className="module-button">打老虎</button>
          </div>
        </div>
      );
    }

    export default ModuleSelectionPage;
