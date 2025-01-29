import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import packageJson from '../package.json';
import { getStoredToken, storeToken, clearToken } from './utils/auth.jsx'; // 修改引用

function LoginPage({ onLoginSuccess, supabase }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const appVersion = packageJson.version;
  const [loading, setLoading] = useState(true); // 添加 loading 状态

  useEffect(() => {
    const checkStoredToken = async () => {
      setLoading(true);
      const token = await getStoredToken();
      if (token) {
        // 验证 JWT 的有效性
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (data && data.user) {
            console.log('离线登录成功:', data.user);
            onLoginSuccess({ ...data.user, role: data.user.role });
          } else {
            console.error('JWT 验证失败:', error);
            clearToken();
          }
        } catch (error) {
          console.error('JWT 验证失败:', error);
          clearToken();
        }
      }
      setLoading(false);
    };
    checkStoredToken();
  }, []);

  const handleSwitchToRegister = () => {
    setIsRegistering(true);
    setErrorMessage('');
    setRegistrationSuccess(false);
  };

  const handleSwitchToLogin = () => {
    setIsRegistering(false);
    setErrorMessage('');
    setRegistrationSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setRegistrationSuccess(true);
    setIsRegistering(false);
  };

  const handleLoginSuccessWithRole = async (user) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('获取用户角色时发生错误:', error);
        onLoginSuccess(user);
      } else if (data) {
        console.log('用户角色:', data.role);
        onLoginSuccess({ ...user, role: data.role });
      } else {
        onLoginSuccess(user);
      }
    } catch (error) {
      console.error('发生意外错误:', error);
      onLoginSuccess(user);
    }
  };

  const handleLoginSuccessWithJWT = async (user, token) => {
    await storeToken(token);
    handleLoginSuccessWithRole(user);
  };

  if (loading) {
    return <p>加载中...</p>;
  }

  return (
    <div className="container">
      {isRegistering ? (
        <RegisterForm
          supabase={supabase}
          onSwitchToLogin={handleSwitchToLogin}
          onRegistrationSuccess={handleRegistrationSuccess}
          onLoginSuccess={handleLoginSuccessWithJWT}
        />
      ) : (
        <LoginForm
          onLoginSuccess={handleLoginSuccessWithJWT}
          supabase={supabase}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {registrationSuccess && <p className="success-message">注册成功，请登录。</p>}
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>v{appVersion}</p>
    </div>
  );
}

export default LoginPage;
