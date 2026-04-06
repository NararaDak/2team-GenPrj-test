import React, { useState } from 'react';
import './ImageGeneration.css';
import { miireboxApi } from '../../api/genBackend';

const ImageGeneration = () => {
  // 프롬프트 입력 텍스트 상태
  const [promptText, setPromptText] = useState('');
  // 포지티브 프롬프트 상태
  const [positivePromptText, setPositivePromptText] = useState('');
  // 네가티브 프롬프트 상태
  const [negativePromptText, setNegativePromptText] = useState('');
  // 생성된 이미지 URL 상태
  const [imageUrl, setImageUrl] = useState('');
  // 이미지 생성 진행 중 여부 상태
  const [isGenerating, setIsGenerating] = useState(false);
  // 오류 메시지 상태
  const [errorMsg, setErrorMsg] = useState('');

  // 프롬프트 입력 변경 핸들러
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };

  const handlePositivePromptChange = (e) => {
    setPositivePromptText(e.target.value);
  };

  const handleNegativePromptChange = (e) => {
    setNegativePromptText(e.target.value);
  };

  // 생성 버튼 클릭 핸들러: 이미지 생성 API 호출 후 결과 표시
  const handleGenerateClick = async () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    setImageUrl('');
    setErrorMsg('');
    const response = await miireboxApi.generateImage(
      promptText.trim(),
      positivePromptText,
      negativePromptText,
    );
    if (response.ok) {
      setImageUrl(response.blobUrl);
    } else {
      setErrorMsg(response.error || '이미지 생성에 실패했습니다.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="image-generation">
      <h1>이미지 생성</h1>

      {/* 여러 줄 프롬프트 입력 텍스트박스 */}
      <textarea
        className="image-generation__prompt"
        value={promptText}
        onChange={handlePromptChange}
        placeholder="기본 프롬프트를 입력하세요."
        rows={4}
      />

      <textarea
        className="image-generation__prompt"
        value={positivePromptText}
        onChange={handlePositivePromptChange}
        placeholder="포지티브 프롬프트를 입력하세요."
        rows={4}
      />

      <textarea
        className="image-generation__prompt"
        value={negativePromptText}
        onChange={handleNegativePromptChange}
        placeholder="네가티브 프롬프트를 입력하세요."
        rows={6}
      />

      {/* 생성 버튼 */}
      <button
        className="image-generation__btn"
        onClick={handleGenerateClick}
        disabled={isGenerating}
      >
        {isGenerating ? '생성 중...' : '생성'}
      </button>

      {isGenerating && (
        <div className="image-generation__loading" role="status" aria-live="polite">
          <span className="image-generation__loading-spinner" aria-hidden="true" />
          이미지 생성 중입니다. 잠시만 기다려 주세요.
        </div>
      )}

      {errorMsg && (
        <p className="image-generation__error" role="alert">{errorMsg}</p>
      )}

      {/* 생성된 이미지 표시 영역 */}
      {imageUrl && (
        <div className="image-generation__result">
          <img
            className="image-generation__result-img"
            src={imageUrl}
            alt="생성된 이미지"
          />
        </div>
      )}
    </div>
  );
};

export default ImageGeneration;
