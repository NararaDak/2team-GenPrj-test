import React, { useEffect, useState } from 'react';
import './BackgroundGeneration.css';
import { modelApi } from '../../api/modelApi';
import { getBackgroundGenerationState, setBackgroundGenerationState } from '../../common/storage';

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

// Data URI에서 순수 base64 문자열만 추출하는 함수
const extractBase64 = (dataUri) => {
  if (!dataUri) return '';
  const base64Index = dataUri.indexOf(';base64,');
  if (base64Index === -1) return dataUri;
  return dataUri.substring(base64Index + 8);
};

const BackgroundGeneration = () => {
  // 초기 상태 로드
  const savedState = getBackgroundGenerationState();
  const [promptText, setPromptText] = useState(savedState.promptText || '');
  const [positivePromptText, setPositivePromptText] = useState(savedState.positivePromptText || '');
  const [negativePromptText, setNegativePromptText] = useState(savedState.negativePromptText || '');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(savedState.uploadedImageDataUri || '');
  const [uploadedFile, setUploadedFile] = useState(null);

  // 결과 이미지 상태
  const [backgroundResultImageUrl, setBackgroundResultImageUrl] = useState(savedState.backgroundResultImageDataUri || '');
  const [ollamaBackgroundResultImageUrl, setOllamaBackgroundResultImageUrl] = useState(savedState.ollamaBackgroundResultImageDataUri || '');
  const [comfyuiBackgroundResultImageUrl, setComfyuiBackgroundResultImageUrl] = useState(savedState.comfyuiBackgroundResultImageDataUri || '');
  const [vlmGptBackgroundResult, setVlmGptBackgroundResult] = useState(savedState.vlmGptBackgroundResult || { imageDataUri: '', vlmText: '' });

  const [generatingMode, setGeneratingMode] = useState('');
  const [activeTab, setActiveTab] = useState('background');
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 파일을 base64로 변환
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // 상태 변경 시 저장
  useEffect(() => {
    setBackgroundGenerationState({
      promptText,
      positivePromptText,
      negativePromptText,
      uploadedImageDataUri: uploadedImageUrl,
      backgroundResultImageDataUri: backgroundResultImageUrl,
      ollamaBackgroundResultImageDataUri: ollamaBackgroundResultImageUrl,
      comfyuiBackgroundResultImageDataUri: comfyuiBackgroundResultImageUrl,
      vlmGptBackgroundResult,
    });
  }, [promptText, positivePromptText, negativePromptText, uploadedImageUrl, backgroundResultImageUrl, ollamaBackgroundResultImageUrl, comfyuiBackgroundResultImageUrl, vlmGptBackgroundResult]);

  // 언마운트 시 상태 저장
  useEffect(() => {
    return () => {
      setBackgroundGenerationState({
        promptText,
        positivePromptText,
        negativePromptText,
        uploadedImageDataUri: uploadedImageUrl,
        backgroundResultImageDataUri: backgroundResultImageUrl,
        ollamaBackgroundResultImageDataUri: ollamaBackgroundResultImageUrl,
        comfyuiBackgroundResultImageDataUri: comfyuiBackgroundResultImageUrl,
        vlmGptBackgroundResult,
      });
    };
  }, [promptText, positivePromptText, negativePromptText, uploadedImageUrl, backgroundResultImageUrl, ollamaBackgroundResultImageUrl, comfyuiBackgroundResultImageUrl, vlmGptBackgroundResult]);

  const handleUploadChange = async (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) return;
    setUploadedFile(selectedFile);
    const dataUri = await fileToBase64(selectedFile);
    setUploadedImageUrl(dataUri);
  };

  const handlePaste = async (event) => {
    const clipboardItems = event.clipboardData && event.clipboardData.items;
    if (!clipboardItems) return;
    for (const item of clipboardItems) {
      if (item.type.startsWith('image/')) {
        const pastedFile = item.getAsFile();
        if (!pastedFile) continue;
        setUploadedFile(pastedFile);
        const dataUri = await fileToBase64(pastedFile);
        setUploadedImageUrl(dataUri);
        break;
      }
    }
  };

  const getGeneratedImageDataUri = async (response, fallbackMessage) => {
    if (response.ok) {
      if (response.blobUrl) {
        const dataUri = await blobUrlToDataUri(response.blobUrl);
        return dataUri || response.blobUrl;
      }
      if (response.imageBase64) {
        return `data:${response.contentType || 'image/png'};base64,${response.imageBase64}`;
      }
    }
    setErrorMsg(response.error || fallbackMessage);
    return '';
  };

  const handleBackgroundGenerateClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('기본 프롬프트를 입력해 주세요.');
      return;
    }
    setGeneratingMode('background');
    setLoadingText('백그라운드 생성 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');
    try {
      const dataUri = uploadedFile ? await fileToBase64(uploadedFile) : uploadedImageUrl;
      const imageBase64 = extractBase64(dataUri);
      const response = await modelApi.makeBackgroundImage(imageBase64, promptText, positivePromptText, negativePromptText);
      const generatedUrl = await getGeneratedImageDataUri(response, '백그라운드 생성에 실패했습니다.');
      if (generatedUrl) setBackgroundResultImageUrl(generatedUrl);
    } catch (e) {
      setErrorMsg(`오류가 발생했습니다: ${e.message}`);
    } finally {
      setGeneratingMode('');
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateOllamaClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('기본 프롬프트를 입력해 주세요.');
      return;
    }
    setGeneratingMode('background-ollama');
    setLoadingText('백그라운드 생성(ollama) 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');
    try {
      const dataUri = uploadedFile ? await fileToBase64(uploadedFile) : uploadedImageUrl;
      const imageBase64 = extractBase64(dataUri);
      const response = await modelApi.makeBackgroundImageOllama(imageBase64, promptText, positivePromptText, negativePromptText);
      const generatedUrl = await getGeneratedImageDataUri(response, 'ollama 백그라운드 생성에 실패했습니다.');
      if (generatedUrl) setOllamaBackgroundResultImageUrl(generatedUrl);
    } catch (e) {
      setErrorMsg(`오류가 발생했습니다: ${e.message}`);
    } finally {
      setGeneratingMode('');
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateComfyuiClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('기본 프롬프트를 입력해 주세요.');
      return;
    }
    setGeneratingMode('background-comfyui');
    setLoadingText('백그라운드 생성(comfyui) 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');
    try {
      const dataUri = uploadedFile ? await fileToBase64(uploadedFile) : uploadedImageUrl;
      const imageBase64 = extractBase64(dataUri);
      const response = await modelApi.makeBackgroundImageComfyui(imageBase64, promptText, positivePromptText, negativePromptText);
      const generatedUrl = await getGeneratedImageDataUri(response, 'comfyui 백그라운드 생성에 실패했습니다.');
      if (generatedUrl) setComfyuiBackgroundResultImageUrl(generatedUrl);
    } catch (e) {
      setErrorMsg(`오류가 발생했습니다: ${e.message}`);
    } finally {
      setGeneratingMode('');
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateVlmGptClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('기본 프롬프트를 입력해 주세요.');
      return;
    }
    setGeneratingMode('background-vlm-gpt');
    setLoadingText('백그라운드 생성(VLM GPT) 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');
    try {
      const dataUri = uploadedFile ? await fileToBase64(uploadedFile) : uploadedImageUrl;
      const imageBase64 = extractBase64(dataUri);
      const response = await modelApi.generateVlmGptImage(imageBase64, promptText, positivePromptText, negativePromptText);
      if (response.ok && (response.imageBase64 || response.blobUrl)) {
        const dataUri = response.imageBase64 
          ? `data:${response.contentType || 'image/png'};base64,${response.imageBase64}`
          : await blobUrlToDataUri(response.blobUrl);
        setVlmGptBackgroundResult({
          imageDataUri: dataUri,
          vlmText: response.vlmText || ''
        });
      } else {
        setErrorMsg(response.error || 'VLM GPT 백그라운드 생성에 실패했습니다.');
      }
    } catch (e) {
      setErrorMsg(`오류가 발생했습니다: ${e.message}`);
    } finally {
      setGeneratingMode('');
      setLoadingText('');
    }
  };

  return (
    <section className="image-generation">
      <h1>백그라운드 생성</h1>
      <div className="image-generation__form">
        <div
          className={`image-generation__upload${uploadedImageUrl ? '' : ' image-generation__upload--empty'}`}
          onPaste={handlePaste}
          tabIndex={0}
          role="region"
          aria-label="이미지 붙여넣기 영역"
        >
          <label className="image-generation__upload-label" htmlFor="background-generation-upload">
            이미지를 넣을 수 있는 창
          </label>
          <input
            id="background-generation-upload"
            className="image-generation__upload-input"
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
          />
          {uploadedImageUrl ? (
            <div className="image-generation__preview-box">
              <img className="image-generation__preview-image" src={uploadedImageUrl} alt="업로드한 이미지" />
            </div>
          ) : (
            <p className="image-generation__paste-hint">이 영역을 클릭하고 Ctrl+V 로 캡처 이미지를 붙여넣을 수 있습니다.</p>
          )}
        </div>

        <label className="image-generation__label" htmlFor="background-generation-prompt">
          기본 프롬프트
        </label>
        <textarea
          id="background-generation-prompt"
          className="image-generation__prompt"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="기본 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-generation__label" htmlFor="background-generation-positive">
          포지티브 프롬프트
        </label>
        <textarea
          id="background-generation-positive"
          className="image-generation__prompt"
          value={positivePromptText}
          onChange={(e) => setPositivePromptText(e.target.value)}
          placeholder="포지티브 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-generation__label" htmlFor="background-generation-negative">
          네가티브 프롬프트
        </label>
        <textarea
          id="background-generation-negative"
          className="image-generation__prompt"
          value={negativePromptText}
          onChange={(e) => setNegativePromptText(e.target.value)}
          placeholder="네가티브 프롬프트를 입력하세요."
          rows={6}
        />

        <div className="image-generation__tabs">
          <button
            className={`image-generation__tab ${activeTab === 'background' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('background')}
            type="button"
          >
            기본
          </button>
          <button
            className={`image-generation__tab ${activeTab === 'ollama' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ollama')}
            type="button"
          >
            Ollama
          </button>
          <button
            className={`image-generation__tab ${activeTab === 'vlm-gpt' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('vlm-gpt')}
            type="button"
          >
            VLM GPT
          </button>
          <button
            className={`image-generation__tab ${activeTab === 'comfyui' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('comfyui')}
            type="button"
          >
            ComfyUI
          </button>
        </div>

        <div className="image-generation__tab-content">
          {activeTab === 'background' && (
            <div className="image-generation__tab-pane">
              <button
                className="image-generation__btn image-generation__btn--full"
                type="button"
                onClick={handleBackgroundGenerateClick}
                disabled={Boolean(generatingMode)}
              >
                {generatingMode === 'background' ? '생성 중...' : '백그라운드 생성'}
              </button>
              <div className="image-generation__result-section">
                {backgroundResultImageUrl ? (
                  <div className="image-generation__generated-box">
                    <img className="image-generation__generated-image" src={backgroundResultImageUrl} alt="백그라운드 생성 결과" />
                  </div>
                ) : (
                  <div className="image-generation__empty-result">생성 결과가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ollama' && (
            <div className="image-generation__tab-pane">
              <button
                className="image-generation__btn image-generation__btn--full image-generation__btn--secondary"
                type="button"
                onClick={handleBackgroundGenerateOllamaClick}
                disabled={Boolean(generatingMode)}
              >
                {generatingMode === 'background-ollama' ? '생성 중...' : 'Ollama 생성'}
              </button>
              <div className="image-generation__result-section">
                {ollamaBackgroundResultImageUrl ? (
                  <div className="image-generation__generated-box">
                    <img className="image-generation__generated-image" src={ollamaBackgroundResultImageUrl} alt="Ollama 생성 결과" />
                  </div>
                ) : (
                  <div className="image-generation__empty-result">생성 결과가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vlm-gpt' && (
            <div className="image-generation__tab-pane">
              <button
                className="image-generation__btn image-generation__btn--full image-generation__btn--secondary"
                type="button"
                onClick={handleBackgroundGenerateVlmGptClick}
                disabled={Boolean(generatingMode)}
              >
                {generatingMode === 'background-vlm-gpt' ? '생성 중...' : 'VLM GPT 생성'}
              </button>
              <div className="image-generation__result-section">
                {vlmGptBackgroundResult.imageDataUri ? (
                  <div className="image-generation__generated-box">
                    <img className="image-generation__generated-image" src={vlmGptBackgroundResult.imageDataUri} alt="VLM GPT 생성 결과" />
                    {vlmGptBackgroundResult.vlmText && (
                      <div style={{ marginTop: '8px', color: '#2a3e58', fontSize: '0.94rem' }}>
                        <strong>VLM 설명:</strong> {vlmGptBackgroundResult.vlmText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="image-generation__empty-result">생성 결과가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comfyui' && (
            <div className="image-generation__tab-pane">
              <button
                className="image-generation__btn image-generation__btn--full image-generation__btn--secondary"
                type="button"
                onClick={handleBackgroundGenerateComfyuiClick}
                disabled={Boolean(generatingMode)}
              >
                {generatingMode === 'background-comfyui' ? '생성 중...' : 'ComfyUI 생성'}
              </button>
              <div className="image-generation__result-section">
                {comfyuiBackgroundResultImageUrl ? (
                  <div className="image-generation__generated-box">
                    <img className="image-generation__generated-image" src={comfyuiBackgroundResultImageUrl} alt="ComfyUI 생성 결과" />
                  </div>
                ) : (
                  <div className="image-generation__empty-result">생성 결과가 없습니다.</div>
                )}
              </div>
            </div>
          )}
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
    </section>
  );
};

export default BackgroundGeneration;