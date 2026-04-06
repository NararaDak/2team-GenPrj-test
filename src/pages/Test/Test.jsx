import React, { useState, useEffect } from 'react';
import { modelApi } from '../../api/modelApi';
import { getTestState, setTestState } from '../../common/storage';
import './Test.css';

const toDisplayText = (value) => {
  if (value === null || value === undefined) return '없음';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '표시할 수 없는 응답 형식';
  }
};

const Test = () => {
  // 초기 상태 한 번만 로드
  const savedState = getTestState();
  const expectedApiUrl = `${modelApi.backendUrl}/model/test`;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(savedState.result || null);

  // 상태 변경 시 저장
  useEffect(() => {
    setTestState({
      result,
    });
  }, [result]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setTestState({
        result,
      });
    };
  }, [result]);

  const handleBackendCheck = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await modelApi.testConnection();

      setResult({
        ok: response.ok,
        apiUrl: response.apiUrl || expectedApiUrl,
        statusCode: response.statusCode ?? null,
        message: response.data ?? null,
        error: response.error ?? null,
      });
    } catch (error) {
      setResult({
        ok: false,
        apiUrl: expectedApiUrl,
        statusCode: null,
        message: null,
        error: error?.message || '요청 처리 중 알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="test-page">
      <h1>접속테스트</h1>
      <p>아래 요청 대상 1개만 접속 확인합니다.</p>

      <div className="test-page__result-card">
        <p>설정된 요청 대상: {expectedApiUrl}</p>
      </div>

      <div className="test-page__form-card">
        <button
          className="test-page__button"
          type="button"
          onClick={handleBackendCheck}
          disabled={isLoading}
        >
          {isLoading ? '확인 중...' : '접속 확인'}
        </button>
      </div>

      {result && (
        <div className="test-page__result-card">
          <h4>백엔드 연결 테스트 결과</h4>
          <p>요청 URL: {toDisplayText(result.apiUrl)}</p>
          <p>성공 여부: {result.ok ? '성공' : '실패'}</p>
          <p>응답 코드: {toDisplayText(result.statusCode)}</p>
          <p className="test-page__pre-wrap">응답 메시지: {toDisplayText(result.message)}</p>
          <p className="test-page__pre-wrap">오류 메시지: {toDisplayText(result.error)}</p>
        </div>
      )}
    </section>
  );
};

export default Test;
