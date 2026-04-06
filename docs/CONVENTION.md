# React 코드 컨벤션

이 문서는 이 프로젝트의 React 프론트엔드 코드 작성 규칙을 정의한다.

목표는 다음과 같다.

- 가독성 향상
- 유지보수성 확보
- 중복 최소화
- 컴포넌트와 모듈의 책임 분리
- 파일 구조와 이름의 일관성 유지


## 1. 적용 범위

이 문서는 다음 범위에 적용한다.

- React 컴포넌트
- 페이지 컴포넌트
- 공통 함수와 API 모듈
- 상태, 이벤트 핸들러, Props 네이밍
- 파일 및 폴더 구조

이 문서는 다음 범위는 다루지 않는다.

- 프로젝트 배경과 목적
- 백엔드 상세 설계
- 배포 및 인프라 정책


## 2. 현재 프로젝트 기준

이 프로젝트는 다음 기준을 사용한다.

- React + Vite 기반 프론트엔드
- JavaScript / JSX 사용
- React Router 사용
- axios 기반 API 호출
- CSS 파일을 컴포넌트 또는 페이지 단위로 분리
- JSX 파일에서도 현재 코드베이스 스타일에 맞춰 React import를 유지한다.

TypeScript는 현재 사용하지 않으므로 타입 규칙은 참고 수준으로만 유지한다.


## 3. 핵심 원칙

1. 한 컴포넌트는 하나의 주된 UI 책임을 가진다.
2. 페이지는 화면 조합과 사용자 흐름에 집중하고, 공통 로직은 별도 함수나 API 모듈로 분리한다.
3. 백엔드 호출은 컴포넌트 내부에 직접 흩뿌리지 말고 src/api 아래의 모듈을 통해 수행한다.
4. 같은 의미의 데이터는 같은 이름을 유지한다.
5. 주석은 부족한 코드를 덮는 용도가 아니라, 의도가 바로 드러나지 않는 경우에만 최소한으로 작성한다.
6. React Hooks 규칙과 ESLint 규칙을 우선한다.
7. 기존 코드와 충돌하지 않는 범위에서 점진적으로 정리하고, 레거시 이름은 한 번에 무리하게 바꾸지 않는다.


## 4. 네이밍 규칙

### 4.1 컴포넌트

- 컴포넌트 이름은 PascalCase를 사용한다.
- 파일명도 컴포넌트명과 동일한 PascalCase를 사용한다.

예:

```jsx
const LoginForm = () => {
  return <div />;
};

export default LoginForm;
```

파일명 예:

- LoginForm.jsx
- ImageGeneration.jsx


### 4.2 훅

- 커스텀 훅 이름은 use로 시작하는 camelCase를 사용한다.
- use 뒤 첫 단어는 대문자로 시작한다.

좋은 예:

- useLoginForm
- useImageGenerator

나쁜 예:

- UseLoginForm
- fetchUserHook


### 4.3 함수, 변수, Props

- 함수, 변수, Props 이름은 camelCase를 사용한다.
- 함수는 동사로 시작한다.
- 의미 없는 축약어는 피한다.
- 이벤트 객체 파라미터 이름은 event 또는 e 중 하나를 선택하되, 같은 함수 범위에서는 섞지 않는다.

좋은 예:

- fetchUserData
- handleLoginSubmit
- profileImageUrl

나쁜 예:

- dataFn
- doIt
- img


### 4.4 상태 이름

- useState의 상태 이름은 camelCase를 사용한다.
- setter는 set + 상태이름 형태를 사용한다.
- Boolean 값은 is, has, should 같은 접두사를 우선 사용한다.

예:

```jsx
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [userInfo, setUserInfo] = useState(null);
```


### 4.5 상수

- 모듈 내부 상수와 전역 상수는 UPPER_SNAKE_CASE를 사용한다.
- 재사용되는 상수는 별도 상수 파일로 분리할 수 있다.

예:

```js
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_STRENGTH = 0.75;
```


### 4.6 이벤트 핸들러

- 컴포넌트 내부 함수는 handle로 시작한다.
- Props로 전달하는 이벤트 핸들러 이름은 on으로 시작한다.

예:

```jsx
const handleSubmit = () => {};

<LoginForm onSubmit={handleSubmit} />
```


## 5. 파일 및 폴더 구조

### 5.1 기본 원칙

- pages 아래에는 화면 단위 컴포넌트를 둔다.
- components 아래에는 여러 페이지에서 재사용 가능한 UI 컴포넌트를 둔다.
- api 아래에는 백엔드 호출 모듈을 둔다.
- common 아래에는 범용 함수와 공통 유틸을 둔다.


### 5.2 폴더 네이밍

- 페이지 및 컴포넌트 폴더는 PascalCase를 사용한다.
- 유틸리티와 API 파일은 역할이 드러나는 camelCase 파일명을 사용한다.

예:

```text
src/
  api/
    baseApi.js
    modelApi.js
    users.js
  components/
    Layout/
      Layout.jsx
      Layout.css
  pages/
    Login/
      Login.jsx
      Signup.jsx
      AuthPage.css
      components/
        AuthField.jsx
```


### 5.3 파일명 규칙

- React 컴포넌트 파일: PascalCase
- 일반 함수 파일: camelCase
- API 파일: 역할 중심 camelCase 또는 복수형 명사
- CSS 파일: 대상 컴포넌트 또는 페이지 이름과 일치
- 페이지 내부에서만 재사용하는 작은 보조 컴포넌트는 pages/{PageName}/components 아래에 둘 수 있다.

좋은 예:

- Login.jsx
- Signup.jsx
- modelApi.js
- users.js
- Layout.css


### 5.4 export 규칙

- 페이지와 UI 컴포넌트는 default export를 기본으로 사용한다.
- API 모듈은 필요 시 클래스 default export와 싱글톤 named export를 함께 사용할 수 있다.

예:

```js
export const usersApi = new UsersApi();
export default UsersApi;
```


## 6. 컴포넌트 작성 규칙

1. 함수형 컴포넌트를 기본으로 사용한다.
2. 컴포넌트 선언은 const + 화살표 함수 형태를 기본으로 사용한다.
3. 컴포넌트가 커지면 하위 컴포넌트로 분리한다.
4. 렌더링과 무관한 로직은 컴포넌트 밖 함수나 API 모듈로 옮긴다.
5. Props가 많아지면 객체 구조를 다시 검토한다.
6. 한 파일 안에서 서로 관련 없는 여러 컴포넌트를 과도하게 정의하지 않는다.

예:

```jsx
const UserProfile = ({ userName }) => {
  return <h1>{userName}</h1>;
};

export default UserProfile;
```


## 7. API 호출 규칙

1. axios 호출은 가능한 한 src/api 아래에서 캡슐화한다.
2. 페이지나 컴포넌트는 usersApi.login 같은 의미 있는 함수만 호출한다.
3. URL 문자열, timeout, 공통 에러 처리는 API 모듈에서 관리한다.
4. 백엔드 스펙의 필드명이 snake_case라면 요청 본문에서는 그 형식을 유지할 수 있다.
5. 공통 HTTP 처리는 baseApi 같은 기반 모듈에 모으고, 기능별 API는 modelApi, users처럼 역할 단위로 나눈다.

예:

```js
const response = await usersApi.login(userName, password);
```


## 8. 주석 규칙

다음 경우에만 주석을 작성한다.

- 비즈니스 의도가 코드만으로 바로 드러나지 않을 때
- 외부 제약이나 백엔드 스펙 때문에 일반적이지 않은 처리가 필요할 때
- 추후 수정 시 주의점이 있을 때

다음 주석은 지양한다.

- 코드 한 줄을 그대로 설명하는 주석
- 이름만 잘 지으면 필요 없는 주석
- 오래되기 쉬운 과도한 설명

현재 소스에는 학습용 또는 설명형 주석이 일부 포함되어 있다. 기존 파일을 수정할 때는 관련 없는 주석을 일괄 제거하지 말고, 변경하는 범위 안에서만 정리한다.


## 9. 스타일 규칙

1. CSS 클래스명은 해당 화면 또는 컴포넌트 문맥을 포함해 충돌을 줄인다.
2. 한 페이지 전용 스타일은 해당 페이지 폴더에 둔다.
3. 공통 스타일이 아니라면 전역 CSS에 과도하게 추가하지 않는다.
4. 인라인 스타일은 일시적이거나 매우 단순한 경우에만 사용하고, 반복되면 CSS 파일로 이동한다.
5. 클래스명은 auth-page__title, image-prompt__upload--empty 같은 block__element--modifier 형태를 권장한다.


## 10. React 관례상 주의할 점

1. Hook은 조건문 안에서 호출하지 않는다.
2. state는 직접 변경하지 않고 setter를 사용한다.
3. 파생 가능한 값은 중복 state로 저장하지 않는다.
4. 이벤트 핸들러 안에서 입력값 검증과 비동기 흐름을 분리해 읽기 쉽게 유지한다.
5. 컴포넌트 이름은 소문자로 시작하지 않는다. 소문자 태그는 HTML 요소로 해석된다.


## 11. 외부 스펙과의 예외 규칙

외부 시스템과 맞춰야 하는 값은 예외를 허용한다.

- 백엔드 요청/응답 JSON 키
- 로컬 스토리지 키
- 세션 스토리지 키
- 서버가 이미 정의한 쿼리 파라미터 이름

예:

- user_name
- user_passwd
- positive_prompt
- negative_prompt

기존 공통 함수명처럼 이미 사용 중인 PascalCase 함수가 있더라도, 신규 함수는 camelCase를 우선한다. 기존 이름 변경은 참조 범위와 영향도를 확인한 뒤 별도 작업으로 진행한다.


## 12. 권장 체크리스트

코드를 작성하거나 수정할 때 아래를 확인한다.

- 이름이 역할을 설명하는가
- 같은 개념에 같은 단어를 쓰는가
- 컴포넌트가 너무 많은 책임을 가지지 않는가
- API 호출이 UI 코드에 과하게 섞여 있지 않은가
- 불필요한 주석이 없는가
- 파일명과 컴포넌트명이 일치하는가
- 현재 프로젝트의 React, Vite, ESLint 규칙과 충돌하지 않는가
