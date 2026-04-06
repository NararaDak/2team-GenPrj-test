import axios from 'axios';
import { GetBackUrl } from '../common/functions';

class CallApi {
  // API 객체 초기화. 타임아웃 및 백엔드 접속 URL 설정
  constructor(timeoutSec = 30) {
    this.timeoutMs = timeoutSec * 1000;
    this.backendUrl = GetBackUrl();

    // axios 인스턴스 생성 (확장성 및 가독성을 위해)
    this.apiClient = axios.create({
      baseURL: this.backendUrl,
      timeout: this.timeoutMs,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // API 응답 데이터를 리스트 형식으로 정규화
  _normalizeDataList(rawData) {
    if (Array.isArray(rawData)) return rawData;
    
    if (rawData !== null && typeof rawData === "object") {
      const ObjectKeys = Object.keys(rawData);
      const isAllDigits = ObjectKeys.length > 0 && ObjectKeys.every(k => /^\d+$/.test(k));
      
      if (isAllDigits) {
        return ObjectKeys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(k => rawData[k]);
      }
      return Object.values(rawData);
    }
    
    if (typeof rawData === "string") {
      try {
        return this._normalizeDataList(JSON.parse(rawData));
      } catch {
        return null;
      }
    }
    return null;
  }

  // POST 방식의 API 요청 처리를 위한 내부 공통 메서드
  async _postData(urlPath, body, failMsg) {
    try {
      const response = await this.apiClient.post(urlPath, body);
      const respJson = response.data;
      
      const statusStr = respJson?.statusCode ? String(respJson.statusCode) : "";
      const isOk = response.status >= 200 && response.status < 300 && statusStr !== "100";

      return {
        ok: isOk,
        apiUrl: `${this.backendUrl}${urlPath}`,
        statusCode: response.status,
        requestBody: body,
        responseJson: respJson,
        data: respJson?.datalist ?? null,
        error: isOk ? null : (respJson?.statusMsg ?? failMsg),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, error: `요청 시간 초과 (${this.timeoutMs}ms)` };
        }
        if (error.response) {
          // 서버 응답이 있는 에러 처리 (예: 4xx, 5xx)
          return {
            ok: false,
            statusCode: error.response.status,
            error: `API 오류: ${error.response.statusText}`,
            text: JSON.stringify(error.response.data),
          };
        }
      }
      return { ok: false, error: `요청 실패: ${error.message}` };
    }
  }

  // GET 방식의 API 요청 처리를 위한 내부 공통 메서드
  async _getData(urlPath) {
    try {
      const response = await this.apiClient.get(urlPath);

      return {
        ok: response.status >= 200 && response.status < 300,
        apiUrl: `${this.backendUrl}${urlPath}`,
        statusCode: response.status,
        data: response.data,
        error: null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, error: `요청 시간 초과 (${this.timeoutMs}ms)` };
        }
        if (error.response) {
          return {
            ok: false,
            apiUrl: `${this.backendUrl}${urlPath}`,
            statusCode: error.response.status,
            error: `API 오류: ${error.response.statusText}`,
            data: error.response.data,
          };
        }
      }
      return { ok: false, apiUrl: `${this.backendUrl}${urlPath}`, error: `요청 실패: ${error.message}` };
    }
  }

  // 백엔드 연결 테스트 API 호출
  async testConnection() {
    return this._getData('/model/test');
  }
  // 이미지 생성 API 호출 (GET 방식, 결과는 blob 이미지, 타임아웃 3분)
  async generateImage(prompt, positivePrompt = '', negativePrompt = '') {
    const queryParams = new URLSearchParams({ prompt });
    if (positivePrompt?.trim()) queryParams.set('positive_prompt', positivePrompt.trim());
    if (negativePrompt?.trim()) queryParams.set('negative_prompt', negativePrompt.trim());

    const urlPath = `/model/generate?${queryParams.toString()}`;
    const imageGenerateTimeoutMs = 3 * 60 * 1000;
    try {
      const response = await this.apiClient.get(urlPath, {
        responseType: 'blob',
        timeout: imageGenerateTimeoutMs,
      });
      const blobUrl = URL.createObjectURL(response.data);
      return { ok: true, apiUrl: `${this.backendUrl}${urlPath}`, statusCode: response.status, blobUrl };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, error: `요청 시간 초과 (${imageGenerateTimeoutMs / 1000}초)` };
        }
        if (error.response) {
          return { ok: false, statusCode: error.response.status, error: `API 오류: ${error.response.statusText}` };
        }
      }
      return { ok: false, error: `요청 실패: ${error.message}` };
    }
  }

  // 이미지+프롬프트 변환 API 호출 (POST, 응답은 바이너리 이미지)
  async changeImage(prompt, imageBase64, strength = 0.75, positivePrompt = '', negativePrompt = '') {
    const urlPath = `/model/changeimage`;
    const imagePromptTimeoutMs = 20 * 60 * 1000;
    const body = {
      prompt,
      positive_prompt: positivePrompt?.trim() || undefined,
      negative_prompt: negativePrompt?.trim() || undefined,
      image_base64: imageBase64,
      strength,
    };
    try {
      const response = await this.apiClient.post(urlPath, body, {
        responseType: 'blob',
        timeout: imagePromptTimeoutMs,
      });
      const blobUrl = URL.createObjectURL(response.data);
      return { ok: true, apiUrl: `${this.backendUrl}${urlPath}`, statusCode: response.status, blobUrl };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, error: `요청 시간 초과 (${imagePromptTimeoutMs}ms)` };
        }
        if (error.response) {
          return { ok: false, statusCode: error.response.status, error: `API 오류: ${error.response.statusText}` };
        }
      }
      return { ok: false, error: `요청 실패: ${error.message}` };
    }
  }
}

// 하나의 인스턴스(싱글톤)로 생성하여 여러 곳에서 편하게 사용할 수 있도록 export 합니다.
export const miireboxApi = new CallApi();
export default CallApi;
