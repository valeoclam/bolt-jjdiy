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
          <h2>JJ的百宝箱</h2>
          {loggedInUser && <p>当前用户: {loggedInUser.username}</p>}
          <div className="module-list">
            <button type="button" onClick={handleInspirationClick} className="module-button inspiration-button">灵感记录</button>
            <button type="button" onClick={handleTigerGameClick} className="module-button tiger-game-button">打打老虎</button>
          </div>
          <button type="button" onClick={onLogout} className="logout-button" style={{ marginTop: '20px' }}>退出</button>
        </div>
      );
    }

    export default ModuleSelectionPage;
