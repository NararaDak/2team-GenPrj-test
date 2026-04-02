import React, { useState } from 'react';
import './ImageGeneration.css';
import { miireboxApi } from '../../api/genBackend';

const ImageGeneration = () => {
  // 프롬프트 입력 텍스트 상태
  const [promptText, setPromptText] = useState('');
  // 생성된 이미지 URL 상태
  const [imageUrl, setImageUrl] = useState('');
  // 이미지 생성 진행 중 여부 상태
  const [isGenerating, setIsGenerating] = useState(false);

  // 프롬프트 입력 변경 핸들러
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };

  // 생성 버튼 클릭 핸들러: 이미지 생성 API URL을 구성하여 이미지 표시
  const handleGenerateClick = () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    const url = miireboxApi.getImageGenerateUrl(promptText.trim());
    setImageUrl(url);
  };

  return (
    <div className="image-generation">
      <h1>이미지 생성</h1>

      {/* 여러 줄 프롬프트 입력 텍스트박스 */}
      <textarea
        className="image-generation__prompt"
        value={promptText}
        onChange={handlePromptChange}
        placeholder="이미지 생성을 위한 프롬프트를 입력하세요."
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

      {/* 생성된 이미지 표시 영역 */}
      {imageUrl && (
        <div className="image-generation__result">
          <img
            className="image-generation__result-img"
            src={imageUrl}
            alt="생성된 이미지"
            onLoad={() => setIsGenerating(false)}
            onError={() => setIsGenerating(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ImageGeneration;
