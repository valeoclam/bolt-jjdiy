import React, { useState } from 'react';

    function LoginPage({ onLoginSuccess, supabase }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [email, setEmail] = useState('');
      const [isRegistering, setIsRegistering] = useState(false);
      const [errorMessage, setErrorMessage] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [registrationSuccess, setRegistrationSuccess] = useState(false);

      const handleAuth = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setRegistrationSuccess(false);

        if (!username || !password) {
          setErrorMessage('用户名和密码是必需的。');
          return;
        }

        if (isRegistering && password !== confirmPassword) {
          setErrorMessage('两次输入的密码不一致。');
          return;
        }

        try {
          let authAction;
          if (isRegistering) {
            authAction = supabase
              .from('users')
              .insert([{ username, password, email }]);
          } else {
            authAction = supabase
              .from('users')
              .select('*')
              .eq('username', username)
              .eq('password', password);
          }

          const { data, error } = await authAction;

          if (error) {
            console.error(isRegistering ? '注册时发生错误:' : '登录时发生错误:', error);
            if (error.code === '23505') {
              setErrorMessage('用户名已被占用，请选择其他用户名。');
            } else {
              setErrorMessage(isRegistering ? '注册失败，请重试。' : '登录失败，请重试。');
            }
          } else if (data && (isRegistering || data.length > 0)) {
            if (isRegistering) {
              setRegistrationSuccess(true);
              setErrorMessage('注册成功，请登录。');
              setIsRegistering(false);
              setConfirmPassword('');
              setEmail('');
            } else {
              console.log('登录成功:', data[0]);
              onLoginSuccess(data[0]);
            }
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
          <h2>{isRegistering ? '用户注册' : '用户登录'}</h2>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label htmlFor="username">用户名:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {isRegistering && (
              <div className="form-group">
                <label htmlFor="email">邮箱 (可选):</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
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
            {isRegistering && (
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
            )}
            <button type="submit">{isRegistering ? '注册' : '登录'}</button>
            <button type="button" onClick={() => {setIsRegistering(!isRegistering); setRegistrationSuccess(false); setErrorMessage('')}} style={{ marginTop: '10px', backgroundColor: '#28a745' }}>
              {isRegistering ? '返回登录' : '切换到注册'}
            </button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {registrationSuccess && <p className="success-message">注册成功，请登录。</p>}
        </div>
      );
    }

    export default LoginPage;
