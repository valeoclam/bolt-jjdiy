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
        <div className="container" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '30px' }}>JJ的百宝箱</h2>
          {loggedInUser && <p style={{ marginBottom: '20px' }}>当前用户: {loggedInUser.username}</p>}
          <div className="module-list" style={{ width: '100%', maxWidth: '400px' }}>
            <button type="button" onClick={handleInspirationClick} className="module-button inspiration-button" style={{ padding: '20px', fontSize: '20px' }}>灵感记录</button>
            <button type="button" onClick={handleTigerGameClick} className="module-button tiger-game-button" style={{ padding: '20px', fontSize: '20px' }}>打打老虎</button>
          </div>
          <button type="button" onClick={onLogout} className="logout-button" style={{ marginTop: '30px', padding: '15px 20px' }}>退出</button>
        </div>
      );
    }

    export default ModuleSelectionPage;
