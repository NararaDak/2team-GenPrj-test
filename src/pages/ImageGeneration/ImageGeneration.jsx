import React, { useEffect, useState } from 'react';
import './ImageGeneration.css';
import { modelApi } from '../../api/modelApi';
import { getImageGenerationState, setImageGenerationState } from '../../common/storage';

// Blob URL을 Data URI로 변환하는 헬퍼 함수
const blobUrlToDataUri = async (blobUrl) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('이미지 변환 실패:', error);
    return '';
  }
};

const ImageGeneration = () => {
  // 초기 상태 한 번만 로드
  const savedState = getImageGenerationState();
  const [promptText, setPromptText] = useState(savedState.promptText || '');
  const [positivePromptText, setPositivePromptText] = useState(savedState.positivePromptText || '');
  const [negativePromptText, setNegativePromptText] = useState(savedState.negativePromptText || '');
  const [imageUrl, setImageUrl] = useState(savedState.imageDataUri || '');
  const [generatingMode, setGeneratingMode] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 상태 변경 시 저장
  useEffect(() => {
    setImageGenerationState({
      promptText,
      positivePromptText,
      negativePromptText,
      imageDataUri: imageUrl,
    });
  }, [promptText, positivePromptText, negativePromptText, imageUrl]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setImageGenerationState({
        promptText,
        positivePromptText,
        negativePromptText,
        imageDataUri: imageUrl,
      });
    };
  }, [promptText, positivePromptText, negativePromptText, imageUrl]);

  const handlePromptChange = (event) => {
    setPromptText(event.target.value);
  };

  const handlePositivePromptChange = (event) => {
    setPositivePromptText(event.target.value);
  };

  const handleNegativePromptChange = (event) => {
    setNegativePromptText(event.target.value);
  };

  const handleGenerateClick = async (mode = 'default') => {
    const trimmedPrompt = promptText.trim();
    const trimmedPositivePrompt = positivePromptText.trim();

    if (mode === 'default' && !trimmedPrompt) return;
    if (mode === 'comfyui' && !trimmedPrompt && !trimmedPositivePrompt) {
      setErrorMsg('ComfyUI 생성은 기본 프롬프트 또는 포지티브 프롬프트가 필요합니다.');
      return;
    }

    setGeneratingMode(mode);
    setLoadingText(mode === 'comfyui' ? '이미지 생성 중입니다(comfyui). 잠시만 기다려 주세요.' : '이미지 생성 중입니다. 잠시만 기다려 주세요.');
    setImageUrl('');
    setErrorMsg('');

    try {
      const response = mode === 'comfyui'
        ? await modelApi.generateImageComfyui(trimmedPrompt, positivePromptText, negativePromptText)
        : await modelApi.generateImage(trimmedPrompt, positivePromptText, negativePromptText);

      if (response.ok) {
        const dataUri = await blobUrlToDataUri(response.blobUrl);
        if (dataUri) {
          setImageUrl(dataUri);
        } else {
          setImageUrl(response.blobUrl);
        }
      } else {
        setErrorMsg(response.error || '이미지 생성에 실패했습니다.');
      }
    } finally {
      setGeneratingMode('');
      setLoadingText('');
    }
  };

  return (
    <section className="image-generation">
      <h1>이미지 생성</h1>

      <div className="image-generation__form">
        <label className="image-generation__label" htmlFor="image-generation-prompt">
          기본 프롬프트
        </label>
        <textarea
          id="image-generation-prompt"
          className="image-generation__prompt"
          value={promptText}
          onChange={handlePromptChange}
          placeholder="기본 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-generation__label" htmlFor="image-generation-positive">
          포지티브 프롬프트
        </label>
        <textarea
          id="image-generation-positive"
          className="image-generation__prompt"
          value={positivePromptText}
          onChange={handlePositivePromptChange}
          placeholder="포지티브 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-generation__label" htmlFor="image-generation-negative">
          네가티브 프롬프트
        </label>
        <textarea
          id="image-generation-negative"
          className="image-generation__prompt"
          value={negativePromptText}
          onChange={handleNegativePromptChange}
          placeholder="네가티브 프롬프트를 입력하세요."
          rows={6}
        />

        <div className="image-generation__actions">
          <button
            className="image-generation__btn"
            onClick={() => handleGenerateClick('default')}
            disabled={Boolean(generatingMode)}
          >
            {generatingMode === 'default' ? '생성 중...' : '생성'}
          </button>
          <button
            className="image-generation__btn image-generation__btn--secondary"
            onClick={() => handleGenerateClick('comfyui')}
            disabled={Boolean(generatingMode)}
          >
            {generatingMode === 'comfyui' ? '생성 중...' : '생성(comfyui)'}
          </button>
        </div>
      </div>

      {Boolean(generatingMode) && (
        <div className="image-generation__loading" role="status" aria-live="polite">
          <span className="image-generation__loading-spinner" aria-hidden="true" />
          {loadingText}
        </div>
      )}

      {errorMsg && (
        <p className="image-generation__error" role="alert">{errorMsg}</p>
      )}

      {imageUrl && (
        <div className="image-generation__result">
          <img
            className="image-generation__result-img"
            src={imageUrl}
            alt="생성된 이미지"
          />
        </div>
      )}
    </section>
  );
};

export default ImageGeneration;
