import React, { useEffect, useState } from 'react';
import { adverApi } from '../../api/adverApi';
import { getAdCopyGenerationState, setAdCopyGenerationState } from '../../common/storage';
import './AdCopyGeneration.css';

const AdCopyGeneration = () => {
  // 초기 상태 한 번만 로드
  const savedState = getAdCopyGenerationState();
  const [inputText, setInputText] = useState(savedState.inputText || '');
  const [tone, setTone] = useState(savedState.tone || '');
  const [targetAudience, setTargetAudience] = useState(savedState.targetAudience || '');
  const [count, setCount] = useState(savedState.count || 3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mainCopy, setMainCopy] = useState(savedState.mainCopy || '');
  const [variants, setVariants] = useState(savedState.variants || []);

  // 상태 변경 시 저장
  useEffect(() => {
    setAdCopyGenerationState({
      inputText,
      tone,
      targetAudience,
      count,
      mainCopy,
      variants,
    });
  }, [inputText, tone, targetAudience, count, mainCopy, variants]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setAdCopyGenerationState({
        inputText,
        tone,
        targetAudience,
        count,
        mainCopy,
        variants,
      });
    };
  }, [inputText, tone, targetAudience, count, mainCopy, variants]);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setErrorMessage('광고문구 생성에 사용할 입력 문장을 작성해 주세요.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setMainCopy('');
    setVariants([]);

    const response = await adverApi.generateAdCopy(
      inputText.trim(),
      tone,
      targetAudience,
      Number(count),
    );

    if (response.ok) {
      const responseJson = response.responseJson || {};
      const responseMainCopy = responseJson?.data || '';
      const responseVariants = Array.isArray(response.data) ? response.data : [];

      setMainCopy(responseMainCopy);
      setVariants(responseVariants);
    } else {
      setErrorMessage(response.error || '광고문구 생성 요청 중 오류가 발생했습니다.');
    }

    setIsGenerating(false);
  };

  return (
    <section className="ad-copy-generation">
      <h1>광고문구 생성</h1>

      <div className="ad-copy-generation__form">
        <label className="ad-copy-generation__label" htmlFor="ad-copy-input-text">
          입력 문장
        </label>
        <textarea
          id="ad-copy-input-text"
          className="ad-copy-generation__textarea"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="예: 신제품 커피 원두 출시 이벤트를 홍보하고 싶어요."
          rows={5}
        />

        <div className="ad-copy-generation__grid">
          <div>
            <label className="ad-copy-generation__label" htmlFor="ad-copy-tone">
              톤 (선택)
            </label>
            <input
              id="ad-copy-tone"
              className="ad-copy-generation__input"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="예: 친근한, 신뢰감 있는"
            />
          </div>

          <div>
            <label className="ad-copy-generation__label" htmlFor="ad-copy-target-audience">
              타겟 고객 (선택)
            </label>
            <input
              id="ad-copy-target-audience"
              className="ad-copy-generation__input"
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              placeholder="예: 20~30대 직장인"
            />
          </div>

          <div>
            <label className="ad-copy-generation__label" htmlFor="ad-copy-count">
              생성 개수 (1~5)
            </label>
            <input
              id="ad-copy-count"
              className="ad-copy-generation__input"
              type="number"
              min="1"
              max="5"
              value={count}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) return;
                setCount(Math.max(1, Math.min(5, next)));
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="ad-copy-generation__button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '생성 중...' : '광고문구 생성'}
        </button>
      </div>

      {errorMessage && <p className="ad-copy-generation__error">{errorMessage}</p>}

      {(mainCopy || variants.length > 0) && (
        <div className="ad-copy-generation__result">
          <h2>생성 결과</h2>

          {mainCopy && (
            <div className="ad-copy-generation__main-copy">
              <h3>대표 문구</h3>
              <p>{mainCopy}</p>
            </div>
          )}

          {variants.length > 0 && (
            <div>
              <h3>문구 후보</h3>
              <ol className="ad-copy-generation__list">
                {variants.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AdCopyGeneration;
