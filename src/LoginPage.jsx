import React, { useState } from 'react';
    import LoginForm from './LoginForm';
    import RegisterForm from './RegisterForm';

    function LoginPage({ onLoginSuccess, supabase }) {
      const [isRegistering, setIsRegistering] = useState(false);
      const [registrationSuccess, setRegistrationSuccess] = useState(false);
      const [errorMessage, setErrorMessage] = useState('');

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
              onLoginSuccess={onLoginSuccess}
              supabase={supabase}
              onSwitchToRegister={handleSwitchToRegister}
            />
          )}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {registrationSuccess && <p className="success-message">注册成功，请登录。</p>}
        </div>
      );
    }

    export default LoginPage;
