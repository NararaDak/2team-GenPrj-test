import React, { useEffect, useState } from 'react';
import { modelApi } from '../../api/modelApi';
import { getImagePromptState, setImagePromptState } from '../../common/storage';
import './ImagePrompt.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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

const ImagePrompt = () => {
  // 초기 상태 한 번만 로드
  const savedState = getImagePromptState();
  const [promptText, setPromptText] = useState(savedState.promptText || '');
  const [positivePromptText, setPositivePromptText] = useState(savedState.positivePromptText || '');
  const [negativePromptText, setNegativePromptText] = useState(savedState.negativePromptText || '');
  // 업로드 이미지: Data URI로 저장/복원 (File 객체는 저장 불가)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(savedState.uploadedImageDataUri || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [strength, setStrength] = useState(savedState.strength || 0.75);
  const [resultImageUrl, setResultImageUrl] = useState(savedState.resultImageDataUri || '');
  const [comfyuiResultImageUrl, setComfyuiResultImageUrl] = useState(savedState.comfyuiResultImageDataUri || '');
  const [backgroundResultImageUrl, setBackgroundResultImageUrl] = useState(savedState.backgroundResultImageDataUri || '');
  const [ollamaBackgroundResultImageUrl, setOllamaBackgroundResultImageUrl] = useState(savedState.ollamaBackgroundResultImageDataUri || '');
  const [comfyuiBackgroundResultImageUrl, setComfyuiBackgroundResultImageUrl] = useState(savedState.comfyuiBackgroundResultImageDataUri || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [vlmGptBackgroundResult, setVlmGptBackgroundResult] = useState(savedState.vlmGptBackgroundResult || { imageDataUri: '', vlmText: '' });
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 상태 변경 시 저장
  useEffect(() => {
    setImagePromptState({
      promptText,
      positivePromptText,
      negativePromptText,
      strength,
      uploadedImageDataUri: uploadedImageUrl,
      resultImageDataUri: resultImageUrl,
      comfyuiResultImageDataUri: comfyuiResultImageUrl,
      backgroundResultImageDataUri: backgroundResultImageUrl,
      ollamaBackgroundResultImageDataUri: ollamaBackgroundResultImageUrl,
      comfyuiBackgroundResultImageDataUri: comfyuiBackgroundResultImageUrl,
      vlmGptBackgroundResult,
    });
  }, [promptText, positivePromptText, negativePromptText, strength, uploadedImageUrl, resultImageUrl, comfyuiResultImageUrl, backgroundResultImageUrl, ollamaBackgroundResultImageUrl, comfyuiBackgroundResultImageUrl, vlmGptBackgroundResult]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setImagePromptState({
        promptText,
        positivePromptText,
        negativePromptText,
        strength,
        uploadedImageDataUri: uploadedImageUrl,
        resultImageDataUri: resultImageUrl,
        comfyuiResultImageDataUri: comfyuiResultImageUrl,
        backgroundResultImageDataUri: backgroundResultImageUrl,
        ollamaBackgroundResultImageDataUri: ollamaBackgroundResultImageUrl,
        comfyuiBackgroundResultImageDataUri: comfyuiBackgroundResultImageUrl,
        vlmGptBackgroundResult,
      });
    };
  }, [promptText, positivePromptText, negativePromptText, strength, uploadedImageUrl, resultImageUrl, comfyuiResultImageUrl, backgroundResultImageUrl, ollamaBackgroundResultImageUrl, comfyuiBackgroundResultImageUrl, vlmGptBackgroundResult]);
  const handleBackgroundGenerateVlmGptClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }
    setIsGenerating(true);
    setLoadingText('백그라운드 생성 중입니다(generate_vlm_gpt_image). 잠시만 기다려 주세요.');
    setErrorMsg('');
    try {
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.generateVlmGptImage(
        imageBase64,
        promptText,
        positivePromptText,
        negativePromptText,
      );
      if (response.ok && response.imageBase64) {
        const dataUri = `data:${response.contentType || 'image/png'};base64,${response.imageBase64}`;
        setVlmGptBackgroundResult({ imageDataUri: dataUri, vlmText: response.vlmText || '' });
      } else {
        setErrorMsg(response.error || '백그라운드 생성(generate_vlm_gpt_image)에 실패했습니다.');
      }
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handlePromptChange = (event) => {
    setPromptText(event.target.value);
  };

  const handlePositivePromptChange = (event) => {
    setPositivePromptText(event.target.value);
  };

  const handleNegativePromptChange = (event) => {
    setNegativePromptText(event.target.value);
  };

  const handleStrengthChange = (event) => {
    setStrength(parseFloat(event.target.value));
  };

  const getGeneratedImageDataUri = async (response, fallbackMessage) => {
    if (response.ok) {
      const dataUri = await blobUrlToDataUri(response.blobUrl);
      return dataUri || response.blobUrl;
    }

    setErrorMsg(response.error || fallbackMessage);
    return '';
  };

  const handleGenerateClick = async () => {
    if (!promptText.trim()) return;
    // File 객체 없어도 저장된 Data URI가 있으면 사용 가능
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }

    setIsGenerating(true);
  setLoadingText('이미지 변환 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');

    try {
      // File이 있으면 변환, 없으면 저장된 Data URI(uploadedImageUrl) 직접 사용
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.changeImage(
        promptText.trim(),
        imageBase64,
        strength,
        positivePromptText,
        negativePromptText,
      );

      const generatedImageUrl = await getGeneratedImageDataUri(response, '이미지 변환에 실패했습니다.');
      if (generatedImageUrl) setResultImageUrl(generatedImageUrl);
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleGenerateComfyuiClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }

    if (!promptText.trim() && !positivePromptText.trim()) {
      setErrorMsg('ComfyUI 생성은 기본 프롬프트 또는 포지티브 프롬프트가 필요합니다.');
      return;
    }

    setIsGenerating(true);
    setLoadingText('이미지 변환 중입니다(comfyui). 잠시만 기다려 주세요.');
    setErrorMsg('');

    try {
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.changeImageComfyui(
        promptText,
        imageBase64,
        strength,
        positivePromptText,
        negativePromptText,
      );

      const generatedImageUrl = await getGeneratedImageDataUri(response, '이미지 변환(comfyui)에 실패했습니다.');
      if (generatedImageUrl) setComfyuiResultImageUrl(generatedImageUrl);
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }

    setIsGenerating(true);
    setLoadingText('백그라운드 생성 중입니다. 잠시만 기다려 주세요.');
    setErrorMsg('');

    try {
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.makeBackgroundImage(
        imageBase64,
        promptText,
        positivePromptText,
        negativePromptText,
      );

      const generatedImageUrl = await getGeneratedImageDataUri(response, '백그라운드 생성에 실패했습니다.');
      if (generatedImageUrl) setBackgroundResultImageUrl(generatedImageUrl);
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateOllamaClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }

    setIsGenerating(true);
    setLoadingText('백그라운드 생성 중입니다(ollama). 잠시만 기다려 주세요.');
    setErrorMsg('');

    try {
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.makeBackgroundImageOllama(
        imageBase64,
        promptText,
        positivePromptText,
        negativePromptText,
      );

      const generatedImageUrl = await getGeneratedImageDataUri(response, '백그라운드 생성(ollama)에 실패했습니다.');
      if (generatedImageUrl) setOllamaBackgroundResultImageUrl(generatedImageUrl);
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleBackgroundGenerateComfyuiClick = async () => {
    const hasImage = uploadedFile !== null || uploadedImageUrl !== '';
    if (!hasImage) {
      setErrorMsg('이미지를 먼저 업로드하거나 붙여넣기 해주세요.');
      return;
    }

    if (!promptText.trim() && !positivePromptText.trim()) {
      setErrorMsg('ComfyUI 백그라운드 생성은 기본 프롬프트 또는 포지티브 프롬프트가 필요합니다.');
      return;
    }

    setIsGenerating(true);
    setLoadingText('백그라운드 생성 중입니다(comfyui). 잠시만 기다려 주세요.');
    setErrorMsg('');

    try {
      const imageBase64 = uploadedFile
        ? await fileToBase64(uploadedFile)
        : uploadedImageUrl;
      const response = await modelApi.makeBackgroundImageComfyui(
        imageBase64,
        promptText,
        positivePromptText,
        negativePromptText,
      );

      const generatedImageUrl = await getGeneratedImageDataUri(response, '백그라운드 생성(comfyui)에 실패했습니다.');
      if (generatedImageUrl) setComfyuiBackgroundResultImageUrl(generatedImageUrl);
    } catch (error) {
      setErrorMsg(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleUploadChange = async (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) return;

    setUploadedFile(selectedFile);
    // Data URI로 변환하여 저장 (페이지 이동 후 복원 가능)
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
        // Data URI로 변환하여 저장 (페이지 이동 후 복원 가능)
        const dataUri = await fileToBase64(pastedFile);
        setUploadedImageUrl(dataUri);
        break;
      }
    }
  };

  return (
    <section className="image-prompt">
      <h1>이미지변경</h1>

      <div className="image-prompt__form">
        <label className="image-prompt__label" htmlFor="image-prompt-basic">
          기본 프롬프트
        </label>
        <textarea
          id="image-prompt-basic"
          className="image-prompt__textarea"
          value={promptText}
          onChange={handlePromptChange}
          placeholder="기본 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-prompt__label" htmlFor="image-prompt-positive">
          포지티브 프롬프트
        </label>
        <textarea
          id="image-prompt-positive"
          className="image-prompt__textarea"
          value={positivePromptText}
          onChange={handlePositivePromptChange}
          placeholder="포지티브 프롬프트를 입력하세요."
          rows={4}
        />

        <label className="image-prompt__label" htmlFor="image-prompt-negative">
          네가티브 프롬프트
        </label>
        <textarea
          id="image-prompt-negative"
          className="image-prompt__textarea"
          value={negativePromptText}
          onChange={handleNegativePromptChange}
          placeholder="네가티브 프롬프트를 입력하세요."
          rows={6}
        />

        <div
          className={`image-prompt__upload${uploadedImageUrl ? '' : ' image-prompt__upload--empty'}`}
          onPaste={handlePaste}
          tabIndex={0}
          role="region"
          aria-label="이미지 붙여넣기 영역"
        >
          <label className="image-prompt__upload-label" htmlFor="image-prompt-upload">
            이미지를 넣을 수 있는 창
          </label>
          <input
            id="image-prompt-upload"
            className="image-prompt__upload-input"
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
          />

          {uploadedImageUrl ? (
            <div className="image-prompt__preview-box">
              <img className="image-prompt__preview-image" src={uploadedImageUrl} alt="업로드한 이미지" />
            </div>
          ) : (
            <p className="image-prompt__paste-hint">이 영역을 클릭하고 Ctrl+V 로 캡처 이미지를 붙여넣을 수 있습니다.</p>
          )}
        </div>

        <div className="image-prompt__strength">
          <label className="image-prompt__strength-label" htmlFor="image-prompt-strength">
            변환 강도 (strength): <strong>{strength.toFixed(2)}</strong>
          </label>
          <input
            id="image-prompt-strength"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={strength}
            onChange={handleStrengthChange}
            className="image-prompt__strength-slider"
          />
        </div>

        <div className="image-prompt__actions">
          <button
            className="image-prompt__btn"
            type="button"
            onClick={handleGenerateClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '생성'}
          </button>
          <button
            className="image-prompt__btn"
            type="button"
            onClick={handleGenerateComfyuiClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '생성(comfyui)'}
          </button>
          <button
            className="image-prompt__btn image-prompt__btn--secondary"
            type="button"
            onClick={handleBackgroundGenerateClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '백그라운드생성'}
          </button>
          <button
            className="image-prompt__btn image-prompt__btn--secondary"
            type="button"
            onClick={handleBackgroundGenerateOllamaClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '백그라운드생성(ollama)'}
          </button>
          <button
            className="image-prompt__btn image-prompt__btn--secondary"
            type="button"
            onClick={handleBackgroundGenerateVlmGptClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '백그라운드생성(generate_vlm_gpt_image)'}
          </button>
                <div className="image-prompt__result-section">
                  <h3 className="image-prompt__result-title">백그라운드 생성 결과(generate_vlm_gpt_image)</h3>
                  {vlmGptBackgroundResult.imageDataUri ? (
                    <div className="image-prompt__generated-box">
                      <img
                        className="image-prompt__generated-image"
                        src={vlmGptBackgroundResult.imageDataUri}
                        alt="백그라운드 생성된 이미지(generate_vlm_gpt_image)"
                      />
                      {vlmGptBackgroundResult.vlmText && (
                        <div style={{ marginTop: '8px', color: '#2a3e58', fontSize: '0.97rem' }}>
                          <strong>VLM 설명:</strong> {vlmGptBackgroundResult.vlmText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="image-prompt__empty-result" aria-label="백그라운드 생성 결과(generate_vlm_gpt_image) 빈 구역">
                      백그라운드 생성 결과(generate_vlm_gpt_image)가 없습니다.
                    </div>
                  )}
                </div>
          <button
            className="image-prompt__btn image-prompt__btn--secondary"
            type="button"
            onClick={handleBackgroundGenerateComfyuiClick}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '백그라운드생성(comfyui)'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="image-prompt__error" role="alert">{errorMsg}</p>
      )}

      {isGenerating && (
        <div className="image-prompt__loading" role="status" aria-live="polite">
          <span className="image-prompt__loading-spinner" aria-hidden="true" />
          {loadingText}
        </div>
      )}

      <div className="image-prompt__result-section">
        <h3 className="image-prompt__result-title">생성 결과</h3>
        {resultImageUrl ? (
          <div className="image-prompt__generated-box">
            <img
              className="image-prompt__generated-image"
              src={resultImageUrl}
              alt="생성된 이미지"
            />
          </div>
        ) : (
          <div className="image-prompt__empty-result" aria-label="생성 결과 빈 구역">
            생성 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="image-prompt__result-section">
        <h3 className="image-prompt__result-title">생성 결과(comfyui)</h3>
        {comfyuiResultImageUrl ? (
          <div className="image-prompt__generated-box">
            <img
              className="image-prompt__generated-image"
              src={comfyuiResultImageUrl}
              alt="생성된 이미지(comfyui)"
            />
          </div>
        ) : (
          <div className="image-prompt__empty-result" aria-label="생성 결과(comfyui) 빈 구역">
            생성 결과(comfyui)가 없습니다.
          </div>
        )}
      </div>

      <div className="image-prompt__result-section">
        <h3 className="image-prompt__result-title">백그라운드 생성 결과</h3>
        {backgroundResultImageUrl ? (
          <div className="image-prompt__generated-box">
            <img
              className="image-prompt__generated-image"
              src={backgroundResultImageUrl}
              alt="백그라운드 생성된 이미지"
            />
          </div>
        ) : (
          <div className="image-prompt__empty-result" aria-label="백그라운드 생성 결과 빈 구역">
            백그라운드 생성 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="image-prompt__result-section">
        <h3 className="image-prompt__result-title">백그라운드 생성 결과(ollama)</h3>
        {ollamaBackgroundResultImageUrl ? (
          <div className="image-prompt__generated-box">
            <img
              className="image-prompt__generated-image"
              src={ollamaBackgroundResultImageUrl}
              alt="백그라운드 생성된 이미지(ollama)"
            />
          </div>
        ) : (
          <div className="image-prompt__empty-result" aria-label="백그라운드 생성 결과(ollama) 빈 구역">
            백그라운드 생성 결과(ollama)가 없습니다.
          </div>
        )}
      </div>

      <div className="image-prompt__result-section">
        <h3 className="image-prompt__result-title">백그라운드 생성 결과(comfyui)</h3>
        {comfyuiBackgroundResultImageUrl ? (
          <div className="image-prompt__generated-box">
            <img
              className="image-prompt__generated-image"
              src={comfyuiBackgroundResultImageUrl}
              alt="백그라운드 생성된 이미지(comfyui)"
            />
          </div>
        ) : (
          <div className="image-prompt__empty-result" aria-label="백그라운드 생성 결과(comfyui) 빈 구역">
            백그라운드 생성 결과(comfyui)가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
};

export default ImagePrompt;