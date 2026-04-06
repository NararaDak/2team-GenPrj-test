import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { getSignupState, setSignupState } from '../../common/storage';
import AuthField from './components/AuthField';
import './AuthPage.css';

const Signup = () => {
  // 초기 상태 한 번만 로드
  const savedState = getSignupState();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState(savedState.loginId || '');
  const [nickname, setNickname] = useState(savedState.nickname || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // loginId, nickname 상태 변경 시 저장 (password는 저장하지 않음)
  useEffect(() => {
    setSignupState({
      loginId,
      nickname,
    });
  }, [loginId, nickname]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setSignupState({
        loginId,
        nickname,
      });
    };
  }, [loginId, nickname]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!loginId.trim() || !nickname.trim() || !password.trim() || !passwordConfirm.trim()) {
      setSuccessMessage('');
      setErrorMessage('아이디, 이름(닉네임), 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setSuccessMessage('');
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const response = await usersApi.signup(loginId.trim(), nickname.trim(), password);

    if (response.ok) {
      setSuccessMessage('회원가입이 완료되었습니다. 로그인 화면으로 이동해 주세요.');
      setErrorMessage('');
      setPassword('');
      setPasswordConfirm('');
      setIsSubmitting(false);
      return;
    }

    setErrorMessage(response.error || '회원가입에 실패했습니다.');
    setIsSubmitting(false);
  };

  return (
    <section className="auth-page">
      <h1 className="auth-page__title">회원 가입</h1>

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthField
            label="아이디"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            showHelp
            autoComplete="username"
          />

          <AuthField
            label="이름 (닉네임)"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="nickname"
          />

          <AuthField
            label="비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            showHelp
            canToggleVisibility
            isVisible={isPasswordVisible}
            onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
            autoComplete="new-password"
          />

          <AuthField
            label="비밀번호 확인"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            canToggleVisibility
            isVisible={isPasswordConfirmVisible}
            onToggleVisibility={() => setIsPasswordConfirmVisible((prev) => !prev)}
            autoComplete="new-password"
          />

          {errorMessage && <p className="auth-feedback auth-feedback--error">{errorMessage}</p>}
          {successMessage && <p className="auth-feedback auth-feedback--success">{successMessage}</p>}

          <div className="auth-actions">
            <button type="submit" className="auth-button auth-button--primary" disabled={isSubmitting}>
              {isSubmitting ? '가입 처리 중...' : '가입하기'}
            </button>
            <button type="button" className="auth-button" onClick={() => navigate('/login')}>
              취소 (로그인으로)
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Signup;