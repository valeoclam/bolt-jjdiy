import React, { useState } from 'react';

    function RegisterForm({ supabase, onSwitchToLogin, onRegistrationSuccess }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [email, setEmail] = useState('');
      const [errorMessage, setErrorMessage] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);

      const handleRegister = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        if (!username || !password || !email) {
          setErrorMessage('用户名、密码和邮箱是必需的。');
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage('两次输入的密码不一致。');
          return;
        }

        try {
          const { data, error } = await supabase
            .from('users')
            .insert([{ username, password, email }]);

          if (error) {
            console.error('注册时发生错误:', error);
            if (error.code === '23505') {
              setErrorMessage('用户名已被占用，请选择其他用户名。');
            } else {
              setErrorMessage('注册失败，请重试。');
            }
          } else {
            console.log('注册成功:', data);
            onRegistrationSuccess();
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setEmail('');
          }
        } catch (error) {
          console.error('发生意外错误:', error);
          setErrorMessage('发生意外错误，请重试。');
        }
      };

      return (
        <div className="container">
          <h2>用户注册</h2>
          <form onSubmit={handleRegister}>
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
              <label htmlFor="email">邮箱:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
            <div className="form-group">
              <label htmlFor="confirmPassword">
                确认密码:
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={showConfirmPassword}
                      onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                    显示
                  </label>
                </div>
              </label>
            </div>
            <button type="submit">注册</button>
            <button type="button" onClick={onSwitchToLogin} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>
              返回登录
            </button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      );
    }

    export default RegisterForm;
