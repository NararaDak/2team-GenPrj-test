import React, { useState } from 'react';
import { miireboxApi } from '../../api/genBackend';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
  const expectedApiUrl = `${miireboxApi.backendUrl}/model/test`;
  const expectedGenerateUrl = `${miireboxApi.backendUrl}/model/generate?prompt={prompt}&positive_prompt={positive_prompt}&negative_prompt={negative_prompt}`;
  const expectedChangeImageUrl = `${miireboxApi.backendUrl}/model/changeimage`;
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChangingImage, setIsChangingImage] = useState(false);
  const [result, setResult] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [positivePromptText, setPositivePromptText] = useState('');
  const [negativePromptText, setNegativePromptText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [strength, setStrength] = useState(0.75);
  const [generateResult, setGenerateResult] = useState(null);
  const [changeImageResult, setChangeImageResult] = useState(null);

  const buildGenerateUrlPreview = () => {
    const params = new URLSearchParams({ prompt: promptText.trim() });
    if (positivePromptText.trim()) params.set('positive_prompt', positivePromptText.trim());
    if (negativePromptText.trim()) params.set('negative_prompt', negativePromptText.trim());
    return `${miireboxApi.backendUrl}/model/generate?${params.toString()}`;
  };

  const handleBackendCheck = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await miireboxApi.testConnection();

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

  const handleGenerateCheck = async () => {
    if (!promptText.trim()) {
      setGenerateResult({ ok: false, error: '기본 프롬프트를 입력해 주세요.' });
      return;
    }

    setIsGenerating(true);
    setGenerateResult(null);

    try {
      const response = await miireboxApi.generateImage(
        promptText.trim(),
        positivePromptText,
        negativePromptText,
      );

      setGenerateResult({
        ok: response.ok,
        apiUrl: response.apiUrl || buildGenerateUrlPreview(),
        statusCode: response.statusCode ?? null,
        blobUrl: response.blobUrl ?? null,
        error: response.error ?? null,
      });
    } catch (error) {
      setGenerateResult({
        ok: false,
        apiUrl: buildGenerateUrlPreview(),
        statusCode: null,
        blobUrl: null,
        error: error?.message || '이미지 생성 요청 중 오류가 발생했습니다.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangeImageCheck = async () => {
    if (!promptText.trim()) {
      setChangeImageResult({ ok: false, error: '기본 프롬프트를 입력해 주세요.' });
      return;
    }
    if (!uploadedFile) {
      setChangeImageResult({ ok: false, error: '변환할 이미지를 먼저 업로드해 주세요.' });
      return;
    }

    setIsChangingImage(true);
    setChangeImageResult(null);

    try {
      const imageBase64 = await fileToBase64(uploadedFile);
      const response = await miireboxApi.changeImage(
        promptText.trim(),
        imageBase64,
        strength,
        positivePromptText,
        negativePromptText,
      );

      setChangeImageResult({
        ok: response.ok,
        apiUrl: response.apiUrl || expectedChangeImageUrl,
        statusCode: response.statusCode ?? null,
        requestBody: {
          prompt: promptText.trim(),
          positive_prompt: positivePromptText.trim() || null,
          negative_prompt: negativePromptText.trim() || null,
          image_base64: '(base64 생략)',
          strength,
        },
        blobUrl: response.blobUrl ?? null,
        error: response.error ?? null,
      });
    } catch (error) {
      setChangeImageResult({
        ok: false,
        apiUrl: expectedChangeImageUrl,
        statusCode: null,
        requestBody: {
          prompt: promptText.trim(),
          positive_prompt: positivePromptText.trim() || null,
          negative_prompt: negativePromptText.trim() || null,
          image_base64: '(base64 생략)',
          strength,
        },
        blobUrl: null,
        error: error?.message || '이미지/프롬프트 요청 중 오류가 발생했습니다.',
      });
    } finally {
      setIsChangingImage(false);
    }
  };

  return (
    <div>
      <h1>테스트</h1>
      <p>백엔드 요청이 실제로 어디로 나가는지 확인하는 페이지입니다.</p>

      <p>설정된 요청 대상: {expectedApiUrl}</p>
      <p>이미지 생성 요청 대상: {expectedGenerateUrl}</p>
      <p>이미지/프롬프트 요청 대상: {expectedChangeImageUrl}</p>

      <hr style={{ margin: '16px 0' }} />
      <h3>공통 입력</h3>
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={3}
        placeholder="기본 프롬프트"
        style={{ width: '100%', maxWidth: 720 }}
      />
      <textarea
        value={positivePromptText}
        onChange={(e) => setPositivePromptText(e.target.value)}
        rows={3}
        placeholder="포지티브 프롬프트"
        style={{ width: '100%', maxWidth: 720, marginTop: 8 }}
      />
      <textarea
        value={negativePromptText}
        onChange={(e) => setNegativePromptText(e.target.value)}
        rows={3}
        placeholder="네가티브 프롬프트"
        style={{ width: '100%', maxWidth: 720, marginTop: 8 }}
      />

      <button type="button" onClick={handleBackendCheck} disabled={isLoading}>
        {isLoading ? '확인 중...' : '백엔드 요청 확인'}
      </button>

      <div style={{ marginTop: '12px' }}>
        <button type="button" onClick={handleGenerateCheck} disabled={isGenerating}>
          {isGenerating ? '생성 요청 중...' : '이미지 생성 요청 확인'}
        </button>
      </div>

      <div style={{ marginTop: '12px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
        />
        <div style={{ marginTop: 8 }}>
          <label htmlFor="test-strength">strength: {strength.toFixed(2)}</label>
          <input
            id="test-strength"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </div>
        <button type="button" onClick={handleChangeImageCheck} disabled={isChangingImage} style={{ marginTop: 8 }}>
          {isChangingImage ? '변환 요청 중...' : '이미지/프롬프트 요청 확인'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <h4>백엔드 연결 테스트 결과</h4>
          <p>요청 URL: {toDisplayText(result.apiUrl)}</p>
          <p>성공 여부: {result.ok ? '성공' : '실패'}</p>
          <p>응답 코드: {toDisplayText(result.statusCode)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>응답 메시지: {toDisplayText(result.message)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>오류 메시지: {toDisplayText(result.error)}</p>
        </div>
      )}

      {generateResult && (
        <div style={{ marginTop: '16px' }}>
          <h4>이미지 생성 테스트 결과</h4>
          <p>요청 URL: {toDisplayText(generateResult.apiUrl)}</p>
          <p>성공 여부: {generateResult.ok ? '성공' : '실패'}</p>
          <p>응답 코드: {toDisplayText(generateResult.statusCode)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>오류 메시지: {toDisplayText(generateResult.error)}</p>
          {generateResult.blobUrl && (
            <img
              src={generateResult.blobUrl}
              alt="생성 테스트 결과"
              style={{ marginTop: 8, maxWidth: 420, width: '100%' }}
            />
          )}
        </div>
      )}

      {changeImageResult && (
        <div style={{ marginTop: '16px' }}>
          <h4>이미지/프롬프트 테스트 결과</h4>
          <p>요청 URL: {toDisplayText(changeImageResult.apiUrl)}</p>
          <p>성공 여부: {changeImageResult.ok ? '성공' : '실패'}</p>
          <p>응답 코드: {toDisplayText(changeImageResult.statusCode)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>요청 본문 미리보기: {toDisplayText(changeImageResult.requestBody)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>오류 메시지: {toDisplayText(changeImageResult.error)}</p>
          {changeImageResult.blobUrl && (
            <img
              src={changeImageResult.blobUrl}
              alt="이미지/프롬프트 테스트 결과"
              style={{ marginTop: 8, maxWidth: 420, width: '100%' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Test;
