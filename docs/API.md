# API 사용 가이드

이 문서는 현재 프론트엔드에서 사용하는 API 모듈과 사용 방법을 설명한다.

이 문서만 봐도 다음 작업을 할 수 있도록 작성한다.

- modelApi.js 호출 방법 이해
- users.js 호출 방법 이해
- Test 페이지를 이용한 API 테스트 방법 이해
- 현재 어떤 화면에서 어떤 API를 사용하는지 파악
- 새로운 화면에서 같은 방식으로 API 연동 추가


## 1. 현재 API 파일 구조

현재 프로젝트의 API 관련 파일은 아래와 같다.

```text
src/
	api/
		baseApi.js
		modelApi.js
		adverApi.js
		imageApi.js
		users.js
```

설명:

- baseApi.js
	공통 axios 설정, base URL, timeout, 공통 GET/POST 처리, 공통 에러 응답 정리를 담당한다.
- modelApi.js
	모델 관련 API를 담당한다.
	예: 백엔드 연결 확인, 이미지 생성, 이미지 변경
- adverApi.js
	광고문구 생성 관련 API를 담당한다.
	예: 광고문구 자동 생성
- imageApi.js
	이미지 파일 관리 관련 API를 담당한다.
	예: 이미지 업로드, 목록 조회, 상세 조회, 다운로드
- users.js
	사용자 관련 API를 담당한다.
	예: 회원가입, 로그인

참고:

- 질문에서 말한 user.js 대신 현재 프로젝트 파일명은 users.js 이다.
- 질문에서 말한 modelAPI.js 대신 현재 프로젝트 파일명은 modelApi.js 이다.
- 현재 코드 기준으로는 이 파일명이 실제 import 경로와 일치한다.


## 2. 공통 동작 방식

모든 API 모듈은 BaseApi를 상속한다.

baseApi.js 에서 담당하는 일:

- 백엔드 주소 설정
- axios 인스턴스 생성
- 공통 GET 요청 처리
- 공통 POST 요청 처리
- timeout 처리
- 서버 오류 응답을 프론트에서 쓰기 쉬운 형태로 변환

백엔드 base URL:

```js
https://gen-proj.duckdns.org/addhelper
```

이 값은 src/common/functions.js 의 getBackendUrl() 에서 관리한다.


## 3. 공통 반환 형식

API 모듈이 반환하는 값은 가능한 한 비슷한 구조를 유지한다.

주로 아래 필드를 사용한다.

```js
{
	ok: true | false,
	apiUrl: '실제로 호출한 URL',
	statusCode: 200,
	data: ...,          
	message: '성공 메시지',
	error: null | '오류 메시지',
	requestBody: {...},
	responseJson: {...},
	blobUrl: 'blob:...'
}
```

주의:

- 모든 API가 모든 필드를 다 반환하는 것은 아니다.
- JSON 응답 API는 보통 data, message, error 를 사용한다.
- 이미지 응답 API는 blobUrl 을 사용한다.
- 호출 성공 여부 판단은 항상 ok 를 먼저 본다.

권장 패턴:

```js
const response = await usersApi.login(userId, password);

if (response.ok) {
	// 성공 처리
} else {
	// 실패 처리
	console.error(response.error);
}
```


## 4. modelApi.js 사용 방법

파일:

- src/api/modelApi.js

import 예시:

```js
import { modelApi } from '../../api/modelApi';
```

현재 modelApi 는 아래 메서드를 제공한다.


### 4.1 testConnection()

백엔드 연결 테스트용 API를 호출한다.

호출 주소:

```text
GET /model/test
```

예시:

```js
const response = await modelApi.testConnection();

if (response.ok) {
	console.log(response.data);
} else {
	console.error(response.error);
}
```

사용 목적:

- 현재 백엔드가 응답하는지 확인
- base URL 이 올바른지 확인
- 프론트에서 실제 요청이 어디로 가는지 검증


### 4.2 generateImage(prompt, positivePrompt, negativePrompt)

이미지 생성 API를 호출한다.

호출 주소:

```text
GET /model/generate?prompt=...&positive_prompt=...&negative_prompt=...
```

파라미터:

- prompt: 필수
- positivePrompt: 선택
- negativePrompt: 선택

예시:

```js
const response = await modelApi.generateImage(
	'카페 앞에 놓인 디저트 진열 사진',
	'realistic, high quality',
	'blurry, low quality'
);

if (response.ok) {
	setImageUrl(response.blobUrl);
} else {
	setErrorMessage(response.error || '이미지 생성에 실패했습니다.');
}
```

반환 특징:

- 성공 시 blobUrl 반환
- 이 blobUrl 을 img src 에 그대로 넣으면 브라우저에서 이미지를 표시할 수 있다.

예시:

```jsx
{imageUrl && <img src={imageUrl} alt="생성 결과" />}
```


### 4.3 changeImage(prompt, imageBase64, strength, positivePrompt, negativePrompt)

기준 이미지와 프롬프트를 함께 보내 변환된 이미지를 받는 API다.

호출 주소:

```text
POST /model/changeimage
```
```text
POST /model/changeimage
```

요청 본문 예시:

```js
{
	prompt: '야경 느낌으로 바꿔줘',
	positive_prompt: 'detailed, cinematic',
	negative_prompt: 'noise, blurry',
	image_base64: 'data:image/png;base64,...',
	strength: 0.75,
}
```

파라미터:

- prompt: 필수
- imageBase64: 필수
- strength: 기본값 0.75
- positivePrompt: 선택
- negativePrompt: 선택

예시:

```js
const imageBase64 = await fileToBase64(uploadedFile);

const response = await modelApi.changeImage(
	promptText,
	imageBase64,
	0.75,
	positivePromptText,
	negativePromptText,
);

if (response.ok) {
	setResultImageUrl(response.blobUrl);
} else {
	setErrorMsg(response.error || '이미지 변환에 실패했습니다.');
}
```


### 4.4 makeBackgroundImage(imageBase64, prompt, positivePrompt, negativePrompt, taskPrompt)

원본 이미지를 기준으로 배경 생성 이미지를 받는 API다.

호출 주소:

```text
POST /model/makebgimage
```

요청 본문 예시:

```js
{
	prompt: '카페 홍보용 배경으로 자연스럽게 정리해줘',
	positive_prompt: 'clean background, realistic, product centered',
	negative_prompt: 'text, watermark, blurry',
	task_prompt: '<DETAILED_CAPTION>',
	image_base64: 'data:image/png;base64,...',
}
```

파라미터:

- imageBase64: 필수
- prompt: 선택
- positivePrompt: 선택
- negativePrompt: 선택
- taskPrompt: 선택

예시:

```js
const response = await modelApi.makeBackgroundImage(
	uploadedImageDataUri,
	promptText,
	positivePromptText,
	negativePromptText,
);

if (response.ok) {
	setImageUrl(response.blobUrl);
} else {
	setErrorMsg(response.error || '백그라운드 생성에 실패했습니다.');
}
```


## 5. adverApi.js 사용 방법

파일:

- src/api/adverApi.js

import 예시:

```js
import { adverApi } from '../../api/adverApi';
```

현재 adverApi 는 아래 메서드를 제공한다.


### 5.1 generateAdCopy(inputText, tone, targetAudience, count)

광고문구 자동 생성 API를 호출한다.

호출 주소:

```text
POST /adver/generate
```

요청 본문:

```js
{
	input_text: inputText,
	tone: tone,             // 선택 (없으면 생략)
	target_audience: targetAudience, // 선택 (없으면 생략)
	count: count,
}
```

파라미터:

- inputText: 필수, 광고문구 생성에 사용할 입력 문장
- tone: 선택, 문체/톤 지정 (예: '친근하게', '격식있게'). 미입력 시 생략
- targetAudience: 선택, 타겟 고객층 지정. 미입력 시 생략
- count: 선택, 기본값 3. 생성할 광고문구 수

예시:

```js
const response = await adverApi.generateAdCopy(
	'신선한 제철 과일을 판매하는 과일 가게',
	'친근하게',
	'30대 주부',
	3,
);

if (response.ok) {
	const { mainCopy, variants } = response.data;
	setMainCopy(mainCopy);
	setVariants(variants);
} else {
	setErrorMessage(response.error || '광고문구 생성에 실패했습니다.');
}
```

반환 특징:

- 성공 시 `response.data` 에 생성 결과 포함
- `response.data.mainCopy`: 대표 광고문구 (문자열)
- `response.data.variants`: 후보 문구 목록 (배열)


## 6. imageApi.js 사용 방법

파일:

- src/api/imageApi.js

import 예시:

```js
import { imageApi } from '../../api/imageApi';
```

현재 imageApi 는 아래 메서드를 제공한다.


### 6.1 uploadImage(userId, imageFile, fileDesc)

이미지 파일을 서버에 업로드한다.

호출 주소:

```text
POST /image/upload  (multipart/form-data)
```

파라미터:

- userId: 필수, 업로드할 사용자 ID
- imageFile: 필수, File 객체
- fileDesc: 선택, 이미지 설명. 기본값 ''

예시:

```js
const response = await imageApi.uploadImage(
	'tester01',
	selectedFile,
	'상품 대표 이미지',
);

if (response.ok) {
	console.log('업로드 성공', response.data);
} else {
	setErrorMessage(response.error || '이미지 업로드에 실패했습니다.');
}
```


### 6.2 listImages({ userId, fileName, fileDesc })

이미지 목록을 조회한다. 모든 파라미터는 선택이며 필터 역할을 한다.

호출 주소:

```text
POST /image/list
```

요청 본문:

```js
{
	user_id: userId,     // 선택, null 이면 전체 사용자
	file_name: fileName, // 선택, null 이면 전체
	file_desc: fileDesc, // 선택, null 이면 전체
}
```

예시:

```js
const response = await imageApi.listImages({
	userId: 'tester01',
	fileName: '',
	fileDesc: '상품',
});

if (response.ok) {
	setImageList(response.data);
} else {
	setErrorMessage(response.error || '이미지 목록 조회에 실패했습니다.');
}
```

반환 특징:

- 성공 시 `response.data` 에 이미지 목록 배열 포함
- 422 오류는 요청 본문 형식 오류를 의미한다.


### 6.3 getImageInfo(imageId)

이미지 ID로 상세 정보를 조회한다.

호출 주소:

```text
POST /image/info
```

파라미터:

- imageId: 필수, 숫자형 이미지 ID

예시:

```js
const response = await imageApi.getImageInfo(42);

if (response.ok) {
	setSelectedInfo(response.data);
} else {
	setErrorMessage(response.error || '이미지 상세 조회에 실패했습니다.');
}
```


### 6.4 downloadImage(imageId)

이미지 ID로 실제 이미지 파일을 다운로드한다.

호출 주소:

```text
POST /image/download
```

파라미터:

- imageId: 필수, 숫자형 이미지 ID

예시:

```js
const response = await imageApi.downloadImage(42);

if (response.ok) {
	setSelectedImageUrl(response.blobUrl);
} else {
	setErrorMessage(response.error || '이미지 다운로드에 실패했습니다.');
}
```

반환 특징:

- 성공 시 `response.blobUrl` 반환
- blobUrl 을 img src 에 그대로 사용할 수 있다.


## 7. users.js 사용 방법

파일:

- src/api/users.js

import 예시:

```js
import { usersApi } from '../../api/users';
```

현재 usersApi 는 아래 메서드를 제공한다.


### 7.1 signup(userId, userName, userPassword)

회원가입 API를 호출한다.

호출 주소:

```text
POST /user/signup
```

요청 본문:

```js
{
	user_id: userId,
	user_name: userName,
	user_passwd: userPassword,
}
```

예시:

```js
const response = await usersApi.signup('tester01', '테스터', '1234');

if (response.ok) {
	console.log(response.message);
	console.log(response.data);
} else {
	console.error(response.error);
}
```

백엔드 참고 응답 구조:

```js
{
	data: '회원가입 성공',
	datalist: [
		{
			user_no: 1,
			user_id: 'tester01',
			user_name: 'tester01',
		}
	]
}
```


### 7.2 login(userId, userPassword)

로그인 API를 호출한다.

호출 주소:

```text
POST /user/login
```

요청 본문:

```js
{
	user_id: userId,
	user_passwd: userPassword,
}
```

예시:

```js
const response = await usersApi.login('tester01', '1234');

if (response.ok) {
	const userInfo = response.data?.[0];
	console.log('로그인 성공', userInfo);
} else {
	console.error(response.error);
}
```

백엔드 오류 예:

- 아이디 또는 비밀번호가 올바르지 않으면 401
- 이미 존재하는 사용자면 회원가입 시 400


## 8. 현재 코드에서의 실제 사용 위치

현재 프로젝트에서는 아래처럼 API가 사용된다.


### 8.1 modelApi 사용 위치

- src/pages/Test/Test.jsx
	백엔드 연결 확인, 이미지 생성, 이미지변경 테스트
- src/pages/ImageGeneration/ImageGeneration.jsx
	이미지 생성 화면
- src/pages/ImagePrompt/ImagePrompt.jsx
	이미지변경 화면


### 8.2 adverApi 사용 위치

- src/pages/AdCopyGeneration/AdCopyGeneration.jsx
	광고문구 자동 생성 화면


### 8.3 imageApi 사용 위치

- src/pages/ImageAttachment/ImageAttachment.jsx
	이미지 업로드, 목록 조회, 상세 조회, 이미지 다운로드


### 8.4 usersApi 사용 위치

- src/pages/Login/Login.jsx
	로그인 처리
- src/pages/Login/Signup.jsx
	회원가입 처리


## 9. Test 페이지로 API 테스트하는 방법

파일:

- src/pages/Test/Test.jsx

현재 Test 페이지는 modelApi 를 수동 검증하는 용도로 만들어져 있다.

가능한 테스트:

1. 백엔드 연결 확인
2. 이미지 생성 요청 확인
3. 이미지/프롬프트 변환 요청 확인

화면에서 확인하는 값:

- 실제 요청 URL
- 성공 여부
- 응답 코드
- 오류 메시지
- 이미지 응답 결과
- changeImage 요청 본문 미리보기


### 9.1 백엔드 연결 확인

동작:

- modelApi.testConnection() 호출
- 현재 백엔드가 살아 있는지 확인

확인 포인트:

- apiUrl
- statusCode
- error


### 9.2 이미지 생성 요청 확인

입력:

- 기본 프롬프트
- 포지티브 프롬프트
- 네가티브 프롬프트

동작:

- modelApi.generateImage(...) 호출

확인 포인트:

- 실제 요청 URL이 기대한 쿼리스트링으로 만들어졌는지
- 응답이 blobUrl 로 오는지
- 이미지가 화면에 표시되는지


### 9.3 이미지변경 요청 확인

입력:

- 기본 프롬프트
- 포지티브 프롬프트
- 네가티브 프롬프트
- 업로드 이미지
- strength 값

동작:

- 업로드한 파일을 base64 로 변환
- modelApi.changeImage(...) 호출

확인 포인트:

- requestBody 미리보기
- statusCode
- error
- 결과 이미지 표시 여부


## 10. 새로운 기능을 개발할 때 권장 방식

새 화면에서 API를 붙일 때는 아래 순서로 진행하는 것을 권장한다.

1. 먼저 Test 페이지에서 백엔드 API가 정상 응답하는지 확인한다.
2. API 성격에 맞게 src/api 아래에 메서드를 추가한다.
3. 페이지 컴포넌트에서는 API 모듈만 import 해서 사용한다.
4. 성공/실패 처리는 response.ok 기준으로 나눈다.
5. 오류 메시지는 response.error 를 우선 표시한다.


### 10.1 새 API 추가 예시

예를 들어 사용자 정보 조회 API를 추가한다고 가정하면 users.js 에 메서드를 추가한다.

```js
class UsersApi extends BaseApi {
	async getProfile(userId) {
		return this.get(`/user/profile/${userId}`);
	}
}
```

페이지에서는 아래처럼 사용한다.

```js
import { usersApi } from '../../api/users';

const handleLoadProfile = async () => {
	const response = await usersApi.getProfile(1);

	if (response.ok) {
		setProfile(response.data);
	} else {
		setErrorMessage(response.error || '프로필 조회에 실패했습니다.');
	}
};
```


## 11. usersApi 를 Test 페이지 방식으로 추가 테스트하고 싶을 때

현재 Test 페이지는 modelApi 중심이다.
같은 방식으로 usersApi 테스트도 쉽게 추가할 수 있다.

예시 흐름:

1. 아이디 입력 state 생성
2. 비밀번호 입력 state 생성
3. usersApi.signup 호출 버튼 추가
4. usersApi.login 호출 버튼 추가
5. 응답 결과를 result 상태에 저장해서 화면에 표시

예시 코드:

```js
import { usersApi } from '../../api/users';

const handleSignupCheck = async () => {
	const response = await usersApi.signup(userId, userName, userPassword);

	setUserResult({
		ok: response.ok,
		apiUrl: response.apiUrl,
		statusCode: response.statusCode,
		data: response.data,
		error: response.error,
	});
};
```

```js
const handleLoginCheck = async () => {
	const response = await usersApi.login(userId, userPassword);

	setUserResult({
		ok: response.ok,
		apiUrl: response.apiUrl,
		statusCode: response.statusCode,
		data: response.data,
		error: response.error,
	});
};
```


## 10. 개발 시 주의사항

1. 백엔드 요청 키 이름은 백엔드 스펙에 맞춰 snake_case 를 유지한다.
2. 프론트 변수명은 camelCase 를 사용하되, 요청 body 에 넣을 때는 user_id, user_name, user_passwd 같은 백엔드 키 형식을 유지한다.
3. 이미지 변환 API는 base64 문자열이 필요하므로 파일 객체를 바로 보내지 않는다.
4. 이미지 API는 응답이 JSON 이 아니라 blob 이므로 response.blobUrl 을 사용해야 한다.
5. 화면에서는 axios 를 직접 호출하지 말고 api 모듈을 통해 호출한다.
6. 새 기능을 붙이기 전에는 가능하면 Test 페이지에서 먼저 검증한다.


## 11. 빠른 요약

- 모델 기능은 modelApi.js 에 추가한다.
- 사용자 기능은 users.js 에 추가한다.
- 공통 axios 설정은 baseApi.js 에 있다.
- 화면에서는 modelApi 또는 usersApi 만 import 해서 사용한다.
- 성공 여부는 response.ok 로 판단한다.
- 이미지 응답은 response.blobUrl 을 사용한다.
- 새 API는 먼저 Test 페이지 방식으로 검증하면 개발이 쉬워진다.
