import React, { useState } from 'react';

    function LoginForm({ onLoginSuccess, supabase, onSwitchToRegister }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [errorMessage, setErrorMessage] = useState('');
      const [showPassword, setShowPassword] = useState(false);

      const handleLogin = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        if (!username || !password) {
          setErrorMessage('用户名和密码是必需的。');
          return;
        }

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password);

          if (error) {
            console.error('登录时发生错误:', error);
            setErrorMessage('登录失败，请重试。');
          } else if (data && data.length > 0) {
            console.log('登录成功:', data[0]);
            onLoginSuccess(data[0]);
          } else {
            setErrorMessage('用户名或密码无效。');
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试。');
        }
      };

      return (
        <div className="container">
          <h2>用户登录</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">用户名:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                密码:
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                    />
                    显示
                  </label>
                </div>
              </label>
            </div>
            <button type="submit">登录</button>
            <button type="button" onClick={onSwitchToRegister} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>
              切换到注册
            </button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      );
    }

    export default LoginForm;
