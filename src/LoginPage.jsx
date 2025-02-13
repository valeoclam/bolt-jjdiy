import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import packageJson from '../package.json';
import { Link } from 'react-router-dom';

function LoginPage({ onLoginSuccess, supabase }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const appVersion = packageJson.version;

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

  return (
    <div className="container">
      {isRegistering ? (
        <RegisterForm
          supabase={supabase}
          onSwitchToLogin={handleSwitchToLogin}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      ) : (
        <LoginForm
          onLoginSuccess={handleLoginSuccessWithRole}
          supabase={supabase}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {registrationSuccess && <p className="success-message">注册成功，请登录。</p>}
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>v{appVersion}</p>
      <Link to="/offline-calculator" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
        <button type="button" style={{ backgroundColor: '#28a745' }}>
          使用离线计算器
        </button>
      </Link>
      <Link to="/offline-tiger-game" style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
        <button type="button" style={{ backgroundColor: '#007bff' }}>
          使用离线打虎日记
        </button>
      </Link>
    </div>
  );
}

export default LoginPage;
