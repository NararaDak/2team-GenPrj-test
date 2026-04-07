import axios from 'axios';
import BaseApi from './baseApi';

class ModelApi extends BaseApi {
  async testConnection() {
    return this.get('/model/test');
  }

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

      return {
        ok: true,
        apiUrl: this.buildUrl(urlPath),
        statusCode: response.status,
        blobUrl: URL.createObjectURL(response.data),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 시간 초과 (${imageGenerateTimeoutMs / 1000}초)` };
        }
        if (error.response) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            statusCode: error.response.status,
            error: `API 오류: ${error.response.statusText}`,
          };
        }

        if (error.request) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            error: '네트워크 연결 실패: 서버 미응답(CORS/SSL/도메인 접근 여부를 확인해 주세요).',
          };
        }
      }

      return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 실패: ${error.message}` };
    }
  }

  async changeImage(prompt, imageBase64, strength = 0.75, positivePrompt = '', negativePrompt = '') {
    const urlPath = '/model/changeimage';
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

      return {
        ok: true,
        apiUrl: this.buildUrl(urlPath),
        statusCode: response.status,
        blobUrl: URL.createObjectURL(response.data),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 시간 초과 (${imagePromptTimeoutMs}ms)` };
        }
        if (error.response) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            statusCode: error.response.status,
            error: `API 오류: ${error.response.statusText}`,
          };
        }

        if (error.request) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            error: '네트워크 연결 실패: 서버 미응답(CORS/SSL/도메인 접근 여부를 확인해 주세요).',
          };
        }
      }

      return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 실패: ${error.message}` };
    }
  }
}

export const modelApi = new ModelApi();
export default ModelApi;