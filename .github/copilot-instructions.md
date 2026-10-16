# Orbit 프로젝트 작업 지침

사용자에게는 한국어로 응답한다. 앱의 UI와 퀴즈 문구는 현재 영어이며, 한국어 응답 요청만으로 앱을 번역하지 않는다.

## 실행 및 브라우저 확인

프로젝트 루트에서 macOS 기본 브라우저로 실행:

```sh
open index.html
```

통합 브라우저에서도 프로젝트의 `index.html`을 `file://` URL로 직접 열 수 있다.

변경 후에는 브라우저에서 아래 동작을 확인한다.

- 첫 문제는 0점, 진행률 0이며 답을 고르기 전에는 다음 버튼이 비활성화된다.
- 정답은 1점을 추가하고, 오답은 점수를 유지한다. 선택 후 모든 답이 잠기며 정답과 해설이 표시된다.
- 진행률은 문제를 열 때가 아니라 답을 선택할 때 증가한다.
- Tab/Shift+Tab으로 버튼을 이동하고 Enter/Space로 선택한다. 다음 문제에서는 질문 제목으로, 결과에서는 결과 제목으로 포커스가 이동한다.
- 10문항 완료 후 점수와 정확도를 확인한다. 결과 등급 경계는 4점, 7점, 10점이다.
- 다시 시작하면 첫 문제, 점수, 진행률, 해설, 버튼 상태가 초기화된다.
- 스타일 변경은 좁은 화면, 다크 모드, 모션 감소 설정에서도 확인한다.

## 구조와 상태 흐름

앱은 `index.html` 하나로 동작하는 정적 페이지다. `<style>`에 디자인, `<main>`에 화면 구조와 인라인 SVG, 본문 끝의 일반 `<script>`에 문제 데이터와 동작이 있다. 외부 리소스나 서버 호출 없이 실행된다.

- `questions`의 각 항목은 `topic`, `question`, `answers`, `correct`, `fact`를 갖는다. `correct`는 `answers`의 0부터 시작하는 인덱스다. 현재 4지선다 10문항을 출제한다. `createRound()`는 원본 배열의 복사본을 Fisher–Yates 방식으로 섞으며, 첫 실행과 재시작 때만 `roundQuestions`를 생성한다. 화면 표시와 정답 판정은 회차 내내 같은 `roundQuestions`를 참조하고, 원본 문항과 선택지 순서는 유지한다.
- `index`, `score`, `answered`가 진행 상태다. 메모리에서만 유지되므로 새로고침하면 초기화된다.
- `renderQuestion()`은 선택지 버튼을 새로 만들고 문제별 UI를 초기화한다. 초기 실행에서는 포커스를 옮기지 않고, 다음 문제와 재시작에서는 `renderQuestion(true)`를 사용한다.
- `selectAnswer()`는 중복 응답을 차단하고 점수, 선택지 상태, 해설, 진행률, 다음 버튼을 갱신한다.
- `showResults()`는 `hidden`으로 퀴즈와 결과 화면을 전환한다. 재시작 핸들러가 공통 상태와 진행률을 초기화한다.
- 회차 순서와 상태 흐름의 회귀 테스트는 외부 의존성 없이 `node --test tests/quiz.test.cjs`로 실행한다.

## 변경 시 함께 맞춰야 하는 규칙

- `el`은 모든 `[id]` 요소를 한 번 수집한 DOM 참조 맵이다. HTML의 ID를 바꾸면 해당 JavaScript 참조와 ARIA 연결도 수정한다. 하이픈이 있는 ID는 `el["question-number"]`처럼 접근한다.
- 동적 문구는 `createElement()`, `textContent`, `append()`, `replaceChildren()`로 구성한다. 선택지 내부는 `.letter`, `.answer-label`, `.answer-mark` 구조를 유지한다.
- 선택지 상태 클래스는 `correct`, `wrong`, `dimmed`, 해설 상태는 `is-correct`, `is-wrong`이다. 시각적 상태뿐 아니라 실제 버튼의 `disabled` 속성과 `answered` 가드도 유지한다.
- 문항 수를 바꿀 때는 `questions.length`를 쓰는 로직 외에도 HTML의 총 문항 수, 소개 문구, 결과 통계, `aria-valuemax`, CSS 진행 막대의 10등분, 결과 등급의 `score === 10` 조건을 함께 검토한다.
- 테마 색상은 `:root`의 CSS 변수와 다크 모드 재정의를 사용한다. 미션 컨트롤 영역은 `--console-line`, `--console-grid`, `--utility-font` 및 `.mission` 내부 오버라이드로 스타일을 맞춘다.
- 레이아웃은 최대 480px의 단일 열이며, 420px 이하에서 별도 여백과 크기를 적용한다. 애니메이션과 전환에는 기존 `prefers-reduced-motion` 처리가 적용되어야 한다.
- `[hidden]`의 강제 숨김 규칙, 질문과 결과 제목의 `tabindex="-1"`, 점수·해설의 라이브 영역, 진행률의 ARIA 값은 화면 상태 변경과 함께 유지한다.
