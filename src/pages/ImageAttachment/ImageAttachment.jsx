import React, { useMemo, useRef, useState, useEffect } from 'react';
import { imageApi } from '../../api/imageApi';
import { getLastLoginUserId, getStorageNumber, setStorageValue, getImageAttachmentState, setImageAttachmentState } from '../../common/storage';
import './ImageAttachment.css';

const CLIPBOARD_SEQUENCE_STORAGE_KEY = 'imageAttachment.clipboardSequence';

const getInitialClipboardSequence = () => {
  const parsed = getStorageNumber(CLIPBOARD_SEQUENCE_STORAGE_KEY, 1);

  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 1;
};

const saveClipboardSequence = (nextSequence) => {
  setStorageValue(CLIPBOARD_SEQUENCE_STORAGE_KEY, nextSequence);
};

const convertImageFileToPng = async (sourceFile, sequence) => {
  const sourceUrl = URL.createObjectURL(sourceFile);

  try {
    const imageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('클립보드 이미지를 읽을 수 없습니다.'));
      img.src = sourceUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;

    if (!canvas.width || !canvas.height) {
      throw new Error('클립보드 이미지 크기를 확인할 수 없습니다.');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('클립보드 이미지 변환 컨텍스트를 생성할 수 없습니다.');
    }

    context.drawImage(imageElement, 0, 0);

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG 변환에 실패했습니다.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });

    return new File([pngBlob], `clipboard${sequence}.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

const ImageAttachment = () => {
  // 초기 상태 한 번만 로드
  const savedState = getImageAttachmentState();
  const [userId, setUserId] = useState(savedState.userId || getLastLoginUserId());
  const [fileDesc, setFileDesc] = useState(savedState.fileDesc || '');
  const [fileNameFilter, setFileNameFilter] = useState(savedState.fileNameFilter || '');
  const [fileDescFilter, setFileDescFilter] = useState(savedState.fileDescFilter || '');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageList, setImageList] = useState(savedState.imageList || []);

  const [selectedImageId, setSelectedImageId] = useState(savedState.selectedImageId || null);
  const [selectedInfo, setSelectedInfo] = useState(savedState.selectedInfo || null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(savedState.selectedImageUrl || '');
  const clipboardSequenceRef = useRef(getInitialClipboardSequence());

  // 입력 필드 및 선택 상태 변경 시 저장
  useEffect(() => {
    setImageAttachmentState({
      userId,
      fileDesc,
      fileNameFilter,
      fileDescFilter,
      selectedImageId,
      selectedInfo,
      selectedImageUrl,
      imageList,
    });
  }, [userId, fileDesc, fileNameFilter, fileDescFilter, selectedImageId, selectedInfo, selectedImageUrl, imageList]);

  // 언마운트 시 상태 저장 (명시적 보장)
  useEffect(() => {
    return () => {
      setImageAttachmentState({
        userId,
        fileDesc,
        fileNameFilter,
        fileDescFilter,
        selectedImageId,
        selectedInfo,
        selectedImageUrl,
        imageList,
      });
    };
  }, [userId, fileDesc, fileNameFilter, fileDescFilter, selectedImageId, selectedInfo, selectedImageUrl, imageList]);

  const canSave = useMemo(
    () => Boolean(userId.trim()) && Boolean(uploadFile),
    [userId, uploadFile],
  );

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFileSelection = (file) => {
    if (!file) return;

    const localImageUrl = URL.createObjectURL(file);
    setUploadFile(file);
    setUploadPreviewUrl(localImageUrl);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    handleFileSelection(selectedFile);
  };

  const handlePaste = async (event) => {
    event.preventDefault();
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return;

    for (const item of clipboardItems) {
      if (!item.type.startsWith('image/')) continue;

      const pastedFile = item.getAsFile();
      if (!pastedFile) continue;

      const sequence = clipboardSequenceRef.current;
      clipboardSequenceRef.current += 1;
      saveClipboardSequence(clipboardSequenceRef.current);

      try {
        const clipboardPngFile = await convertImageFileToPng(pastedFile, sequence);
        handleFileSelection(clipboardPngFile);
      } catch (error) {
        setErrorMessage(error.message || '클립보드 이미지를 PNG로 변환하지 못했습니다.');
      }
      break;
    }
  };

  const handleUpload = async () => {
    if (!canSave) {
      setErrorMessage('user_id와 이미지 파일을 확인해 주세요.');
      return;
    }

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setErrorMessage('user_id(로그인 아이디)는 필수입니다.');
      return;
    }

    resetMessages();
    setIsUploading(true);

    const response = await imageApi.uploadImage(trimmedUserId, uploadFile, fileDesc);

    if (response.ok) {
      setSuccessMessage(response.message || '이미지 업로드가 완료되었습니다.');
      await handleLoadList(true);
    } else {
      setErrorMessage(response.error || '이미지 업로드에 실패했습니다.');
    }

    setIsUploading(false);
  };

  const handleLoadList = async (silent = false) => {
    if (!userId.trim() && !fileNameFilter.trim() && !fileDescFilter.trim()) {
      if (!silent) setErrorMessage('목록 조회 시 user_id 또는 파일명/설명 검색어가 필요합니다.');
      return;
    }

    if (!silent) resetMessages();
    setIsLoadingList(true);

    const response = await imageApi.listImages({
      userId: userId.trim() ? userId.trim() : null,
      fileName: fileNameFilter,
      fileDesc: fileDescFilter,
    });

    if (response.ok) {
      const listData = response.data?.datalist;
      const normalized = Array.isArray(listData)
        ? listData
        : Array.isArray(response.data)
          ? response.data
          : [];
      setImageList(normalized);
      if (!silent) setSuccessMessage(`목록 ${normalized.length}건을 불러왔습니다.`);
    } else {
      if (!silent) setErrorMessage(response.error || '이미지 목록 조회에 실패했습니다.');
    }

    setIsLoadingList(false);
  };

  const handleSelectImage = async (imageId) => {
    resetMessages();
    setSelectedImageId(imageId);
    setIsLoadingDetail(true);

    const infoResponse = await imageApi.getImageInfo(imageId);
    const downloadResponse = await imageApi.downloadImage(imageId);

    if (!infoResponse.ok) {
      setErrorMessage(infoResponse.error || '이미지 상세 조회에 실패했습니다.');
      setIsLoadingDetail(false);
      return;
    }

    if (!downloadResponse.ok) {
      setErrorMessage(downloadResponse.error || '이미지 다운로드 데이터 조회에 실패했습니다.');
      setIsLoadingDetail(false);
      return;
    }

    const detail = Array.isArray(infoResponse.data?.datalist)
      ? infoResponse.data.datalist[0]
      : Array.isArray(infoResponse.data)
        ? infoResponse.data[0]
        : null;

    setSelectedInfo(detail || null);
    setSelectedImageUrl(downloadResponse.blobUrl || '');
    setIsLoadingDetail(false);
  };

  const handleDownloadSelected = async () => {
    if (!selectedImageId) return;

    const response = await imageApi.downloadImage(selectedImageId);
    if (!response.ok || !response.blobUrl) {
      setErrorMessage(response.error || '다운로드에 실패했습니다.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = response.blobUrl;
    anchor.download = selectedInfo?.stored_name || `image_${selectedImageId}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <section className="image-attachment-page">
      <h1>이미지첨부</h1>

      {(errorMessage || successMessage) && (
        <p className={`image-attachment-page__message ${errorMessage ? 'image-attachment-page__message--error' : 'image-attachment-page__message--success'}`}>
          {errorMessage || successMessage}
        </p>
      )}

      <div className="image-attachment-page__layout">
        <section className="image-attachment-page__panel">
          <h2>저장된 이미지 ID 목록</h2>

          <div className="image-attachment-page__filters">
            <label htmlFor="image-attachment-user-id">user_id (로그인 아이디)</label>
            <input
              id="image-attachment-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="예: user01"
            />

            <label htmlFor="image-attachment-file-name">파일명 검색(선택)</label>
            <input
              id="image-attachment-file-name"
              value={fileNameFilter}
              onChange={(event) => setFileNameFilter(event.target.value)}
              placeholder="stored_name 또는 original_name"
            />

            <label htmlFor="image-attachment-file-desc">설명 검색(선택)</label>
            <input
              id="image-attachment-file-desc"
              value={fileDescFilter}
              onChange={(event) => setFileDescFilter(event.target.value)}
              placeholder="file_desc"
            />

            <button type="button" onClick={() => handleLoadList()} disabled={isLoadingList}>
              {isLoadingList ? '조회 중...' : '목록 조회'}
            </button>
          </div>

          <ul className="image-attachment-page__list">
            {imageList.map((item) => (
              <li key={item.image_id}>
                <button
                  type="button"
                  className={selectedImageId === item.image_id ? 'is-active' : ''}
                  onClick={() => handleSelectImage(item.image_id)}
                >
                  <strong>ID {item.image_id}</strong>
                  <span>{item.stored_name || item.original_name || '파일명 없음'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="image-attachment-page__panel">
          <h2>이미지 첨부 / 붙여넣기 저장</h2>

          <label htmlFor="image-attachment-desc">파일 설명 (선택)</label>
          <input
            id="image-attachment-desc"
            value={fileDesc}
            onChange={(event) => setFileDesc(event.target.value)}
            placeholder="예: 제품 사진 원본"
          />

          <div
            className="image-attachment-page__dropzone"
            onPaste={handlePaste}
            tabIndex={0}
            role="region"
            aria-label="이미지 붙여넣기 영역"
          >
            <p>파일 첨부 또는 Ctrl+V 로 이미지 붙여넣기</p>
            <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} />
          </div>

          {uploadPreviewUrl && (
            <div className="image-attachment-page__preview-box">
              <img src={uploadPreviewUrl} alt="업로드 예정 이미지" />
            </div>
          )}

          <button type="button" onClick={handleUpload} disabled={!canSave || isUploading}>
            {isUploading ? '저장 중...' : '저장'}
          </button>

          <h3>선택된 이미지 상세</h3>
          {isLoadingDetail && <p>상세 조회 중...</p>}

          {selectedInfo && (
            <div className="image-attachment-page__detail">
              <p>ID: {selectedInfo.image_id}</p>
              <p>설명: {selectedInfo.file_desc || '없음'}</p>
              <p>파일명: {selectedInfo.stored_name || '없음'}</p>
              <p>용량: {selectedInfo.file_size || 0} bytes</p>
            </div>
          )}

          {selectedImageUrl && (
            <div className="image-attachment-page__preview-box">
              <img src={selectedImageUrl} alt="선택된 저장 이미지" />
            </div>
          )}

          <button type="button" onClick={handleDownloadSelected} disabled={!selectedImageId}>
            다운로드
          </button>
        </section>
      </div>
    </section>
  );
};

export default ImageAttachment;