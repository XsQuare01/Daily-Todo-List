# Daily Todo List 세부 구현 문서

이 문서는 `IMPLEMENTATION.md`의 기술 기준과 `IMPLEMENTATION_ROADMAP.md`의 개발 순서를 합쳐서, 실제 구현 작업에 바로 사용할 수 있는 상세 실행 문서로 정리한 초안입니다.

목표는 다음 두 가지입니다.

- 구현 시 어떤 파일과 기능을 먼저 다뤄야 하는지 한눈에 보이게 한다.
- 각 단계가 끝났는지 판단할 수 있도록 완료 조건과 검증 포인트를 함께 둔다.

---

## 1. 문서 사용 방식

이 문서는 세 층으로 읽으면 됩니다.

1. **시스템 기준선**: 지금 앱이 어떤 구조로 되어 있어야 하는지 설명
2. **단계별 구현 순서**: 어떤 기능을 어떤 순서로 만드는지 설명
3. **완료 조건 / 검증 포인트**: 각 단계가 실제로 끝났는지 판단하는 기준

즉, `IMPLEMENTATION.md`가 **무엇을 만들지**를 정의하는 문서라면, 이 문서는 **어떤 순서로 어떻게 구현할지**를 정리한 작업 문서입니다.

---

## 2. 시스템 기준선

### 2-1. 기술 스택

- **런타임**: Electron
- **UI**: React + TypeScript
- **스타일**: Tailwind CSS v4
- **빌드**: Vite + electron-vite
- **아이콘**: lucide-react
- **드래그 앤 드롭**: `@dnd-kit/core`

### 2-2. 프로세스 구조

#### Main Process

- `src/main/index.ts`
  - 앱 진입점
  - 창 생성 / 표시 / 숨김
  - 트레이 관리
  - 전역 단축키 등록
  - IPC 핸들러 연결
- `src/main/todos-store.ts`
  - `todos.json` 읽기/쓰기
  - Todo 저장 처리
  - 저장 후 모든 창에 `todos:updated` 브로드캐스트
- `src/main/settings-store.ts`
  - `settings.json` 읽기/쓰기
  - 위젯 위치/크기, 클릭 통과, extraWidgets 관리

#### Preload

- `src/preload/index.ts`
  - `window.api` 브릿지 제공
- `src/shared/window-api.ts`
  - Renderer가 사용하는 API 타입 정의

#### Renderer

- `src/renderer/src/App.tsx`
  - 팝업 뷰
  - 데스크톱 뷰
- `src/renderer/src/WidgetView.tsx`
  - 위젯 뷰
  - 태그 위젯 뷰
- `src/renderer/src/components/`
  - `TodoItem.tsx`
  - `TodoList.tsx`
  - `AddTodoInput.tsx`
- `src/renderer/src/lib/`
  - `todos-ipc.ts`
  - `todo-input.ts`
  - `filters.ts`
  - `date.ts`
  - `utils.ts`
- `src/renderer/src/types/todo.ts`
  - Todo / Subtask / Priority / FilterType 타입 정의

---

## 3. 핵심 데이터 구조

### 3-1. Todo

```ts
interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  important: boolean
  createdAt: string
  dueDate?: string
  tags?: string[]
  elapsedMs?: number
  priority?: 'high' | 'medium' | 'low'
  subtasks?: Subtask[]
  link?: string
}
```

### 3-2. Subtask

```ts
interface Subtask {
  id: string
  title: string
  completed: boolean
}
```

### 3-3. 저장 파일

- `todos.json`
  - Todo 배열 저장
- `settings.json`
  - 위젯 위치/크기
  - 클릭 통과 여부
  - 태그 위젯 목록과 각 위젯 bounds 저장

---

## 4. 단계별 구현 순서

이 섹션은 로드맵을 실제 구현 단위로 더 잘게 나눈 것입니다.

---

## 5. 1단계 — 앱 골격 + 기본 Todo 흐름

### 목표

앱이 실행되고, 트레이에서 팝업을 열어 기본 Todo를 추가/저장/표시할 수 있어야 합니다.

### 구현 범위

- Electron 기본 실행 구조 구성
- 트레이 아이콘 생성
- 팝업 창 생성 및 표시/숨김
- 기본 위젯 창 생성
- `window.api` IPC 브릿지 연결
- `todos.json` 읽기/쓰기
- Todo CRUD의 최소 흐름 구성
- 팝업의 오늘/전체/완료 필터 구성
- `Ctrl+Shift+N` 입력 포커스 흐름 연결

### 주요 작업 파일

- `src/main/index.ts`
- `src/main/todos-store.ts`
- `src/preload/index.ts`
- `src/shared/window-api.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/lib/todos-ipc.ts`
- `src/renderer/src/components/AddTodoInput.tsx`
- `src/renderer/src/types/todo.ts`

### 완료 조건

- 앱 실행 시 트레이 아이콘이 보인다.
- 팝업 창을 열고 닫을 수 있다.
- 할 일을 추가하면 목록에 즉시 반영된다.
- 앱을 다시 실행해도 `todos.json`에서 복원된다.
- 팝업의 오늘/전체/완료 필터가 정상 동작한다.

### 검증 포인트

- 팝업에서 새 Todo 추가 후 재실행하여 복원 확인
- 완료 토글 후 완료 필터에서 보이는지 확인
- 저장 후 팝업과 위젯이 같은 데이터를 보는지 확인

---

## 6. 2단계 — 날짜 / 태그 / 우선순위 기반 정리 기능

### 목표

기본 입력 앱에서 벗어나, 사용자가 Todo를 분류하고 정리할 수 있어야 합니다.

### 구현 범위

- `#태그` 자동 파싱
- 날짜 네비게이터
- 태그 필터 / 태그 선택기
- 중요 필터
- 우선순위 표시 및 수정
- 마감일 입력 및 수정
- D-Day 계산 표시
- 위젯의 빠른 추가 입력
- 저장 후 창 간 동기화 강화

### 주요 작업 파일

- `src/renderer/src/App.tsx`
- `src/renderer/src/WidgetView.tsx`
- `src/renderer/src/lib/todo-input.ts`
- `src/renderer/src/lib/filters.ts`
- `src/renderer/src/lib/date.ts`
- `src/renderer/src/types/todo.ts`

### 완료 조건

- `#업무`, `#개인` 같은 입력이 자동으로 tags로 저장된다.
- 팝업에서 날짜 이동이 가능하다.
- 중요 / 태그 필터가 정상 동작한다.
- 우선순위와 마감일이 표시되고 수정 가능하다.
- 위젯에서 빠른 추가로 생성한 Todo도 정상 저장된다.

### 검증 포인트

- 태그 입력 후 태그 필터에서 항목이 보이는지 확인
- 마감일 입력 후 D-Day가 의도대로 계산되는지 확인
- 팝업에서 수정한 내용이 위젯에 즉시 반영되는지 확인

---

## 7. 3단계 — 위젯 상태 저장 + 창 동작 안정화

### 목표

위젯을 상시 사용하는 데 필요한 창 상태 관리가 안정적으로 동작해야 합니다.

### 구현 범위

- 위젯 위치 저장
- 위젯 크기 저장
- 앱 재실행 시 위치/크기 복원
- 가장자리 스냅
- 클릭 통과 모드 저장 및 적용
- 팝업/위젯 표시 상태 정리
- 포커스 아웃 시 팝업 자동 숨김
- `Ctrl+Shift+D` 위젯 토글

### 주요 작업 파일

- `src/main/index.ts`
- `src/main/settings-store.ts`
- `src/renderer/src/WidgetView.tsx`
- `src/shared/window-api.ts`
- `src/preload/index.ts`

### 완료 조건

- 위젯을 옮기고 크기를 바꾼 뒤 재실행해도 같은 상태가 복원된다.
- 화면 가장자리 근처에서 스냅이 동작한다.
- 클릭 통과 모드를 켜고 끌 수 있다.
- 팝업이 포커스를 잃으면 숨겨진다.

### 검증 포인트

- 위젯 이동/리사이즈 후 앱 재실행 확인
- 클릭 통과 켠 뒤 트레이로 해제 가능한지 확인
- 팝업 열림 상태에서 외부 클릭 시 숨김 확인

---

## 8. 4단계 — 상세 편집 + 위젯 상세 화면

### 목표

각 Todo를 세부적으로 수정하고, 위젯에서도 상세 내용을 확인하고 조작할 수 있어야 합니다.

### 구현 범위

- TodoItem 펼침/접힘 UI
- 메모 blur 저장
- 링크 입력 및 외부 브라우저 열기
- 서브태스크 추가 / 완료 토글 / 진행률 표시
- 위젯에서 할 일 클릭 시 상세 화면 진입
- 위젯 상세 화면에서 태그 / 링크 / 서브태스크 표시
- 위젯 상세 화면에서 완료 처리 후 목록 복귀
- 위젯 우클릭 컨텍스트 메뉴
- 데스크톱 창 기본 생성 / 숨김 / 단축키 연결
- 네트워크 날짜 조회 및 fallback 처리

### 주요 작업 파일

- `src/renderer/src/components/TodoItem.tsx`
- `src/renderer/src/WidgetView.tsx`
- `src/renderer/src/App.tsx`
- `src/main/index.ts`
- `src/renderer/src/lib/date.ts`

### 완료 조건

- Todo를 펼쳐 메모 / 링크 / 태그를 편집할 수 있다.
- 서브태스크를 추가하고 완료 상태를 바꿀 수 있다.
- 위젯 목록에서 Todo를 클릭하면 상세 화면이 열린다.
- 상세 화면에서 완료 처리 후 목록으로 복귀한다.
- `Ctrl+Shift+M`으로 데스크톱 창이 열린다.

### 검증 포인트

- 메모 수정 후 blur 시 저장되는지 확인
- 링크 클릭 시 시스템 브라우저가 열리는지 확인
- 서브태스크 진행률이 목록/상세 모두에 반영되는지 확인
- 위젯 상세 화면에서 완료 처리 후 목록 복귀 확인

---

## 9. 5단계 — 작업 허브 기능 완성

### 목표

앱이 단순 Todo 목록이 아니라, 집중 작업을 위한 데스크톱 허브로 동작해야 합니다.

### 구현 범위

- 데스크톱 2열 레이아웃
  - Pending Lane
  - Important Lane
- 다중 선택
- 일괄 작업
  - 완료 처리
  - 중요 표시
  - 중요 해제
  - 삭제
- Focus Session 패널
- Todo별 독립 타이머
- 동시에 하나만 실행되는 스톱워치
- 완료 시 타이머 자동 정지
- `@dnd-kit/core` 기반 정렬
- 태그 위젯 생성 및 개별 저장

### 주요 작업 파일

- `src/renderer/src/App.tsx`
- `src/renderer/src/components/TodoList.tsx`
- `src/renderer/src/components/TodoItem.tsx`
- `src/main/index.ts`
- `src/main/settings-store.ts`

### 완료 조건

- 데스크톱 창에서 Pending / Important 2열이 분리되어 보인다.
- 다중 선택 후 일괄 작업이 가능하다.
- Focus Session 패널이 상위 후보를 보여준다.
- 타이머는 동시에 하나만 실행된다.
- 태그 위젯을 생성하고 위치/크기를 각각 저장할 수 있다.

### 검증 포인트

- 2개 이상의 항목 선택 후 일괄 완료/삭제 확인
- 타이머를 다른 Todo로 전환했을 때 이전 타이머가 멈추는지 확인
- 태그 위젯 생성 후 재실행해도 복원되는지 확인

---

## 10. 6단계 — 장기 사용성 확장

### 목표

오래 쓰는 앱으로 가기 위한 관리 편의성과 데이터 운영 기능을 추가합니다.

### 구현 범위

- 검색
  - 제목 / 메모 / 태그 기준 검색
- 반복 할 일
  - 매일 / 매주 / 평일 반복
- 정렬 옵션
  - 우선순위순 / 마감일순 / 생성순
- 완료 항목 자동 정리
  - 숨김 / 아카이브 / n일 후 정리 규칙
- 백업 / 내보내기
  - JSON 내보내기 / 가져오기

### 완료 조건

- Todo가 많아져도 검색으로 빠르게 찾을 수 있다.
- 반복 할 일을 자동 생성할 수 있다.
- 정렬 옵션을 화면별로 선택할 수 있다.
- 완료 항목 정리 정책을 둘 수 있다.
- 사용자가 데이터를 수동으로 백업/복원할 수 있다.

### 검증 포인트

- 검색어로 제목/태그/메모 검색 확인
- 반복 규칙 완료 후 다음 항목 자동 생성 확인
- 백업 파일 내보내기 후 다시 가져오기 확인

---

## 11. 공통 구현 원칙

### 11-1. 상태 일관성

- Todo 저장은 항상 `persistTodos`를 통해 처리한다.
- 저장 후에는 모든 창이 같은 최신 상태를 본다.
- 팝업 / 위젯 / 데스크톱 간 데이터 차이가 생기지 않아야 한다.

### 11-2. 날짜 처리

- 기본 기준은 KST 문자열 날짜다.
- 네트워크 날짜는 정확도 향상용이며, 실패 시 로컬 KST 계산으로 fallback 한다.

### 11-3. 위젯 UX

- 위젯은 빠른 확인과 빠른 조작이 목적이다.
- 상세 편집의 중심은 팝업/데스크톱에 두고, 위젯은 필요한 최소 조작만 제공한다.

### 11-4. 저장 정책

- Todo 데이터와 설정 데이터는 분리 저장한다.
- 구조가 다른 데이터는 한 파일에 섞지 않는다.

---

## 12. 단계별 최종 체크리스트

### MVP 완료 체크

- [ ] 팝업 열기/숨기기 가능
- [ ] 기본 위젯 표시 가능
- [ ] Todo 추가/완료/삭제 가능
- [ ] `todos.json` 저장/복원 가능
- [ ] 오늘/전체/완료 필터 동작

### v1.1 완료 체크

- [ ] 태그 파싱 동작
- [ ] 날짜 네비게이터 동작
- [ ] 중요/태그 필터 동작
- [ ] 우선순위 / 마감일 / D-Day 동작
- [ ] 위젯 빠른 추가 및 동기화 동작

### v1.2 완료 체크

- [ ] 상세 편집 UI 동작
- [ ] 서브태스크 동작
- [ ] 위젯 상세 화면 동작
- [ ] 네트워크 날짜 fallback 동작
- [ ] 데스크톱 창 기본 열기/숨김 동작

### v2 완료 체크

- [ ] 데스크톱 2열 뷰 동작
- [ ] 일괄 작업 동작
- [ ] Focus Session 동작
- [ ] 타이머 동작
- [ ] 태그 위젯 동작

### v3 완료 체크

- [ ] 검색 동작
- [ ] 반복 할 일 동작
- [ ] 정렬 옵션 동작
- [ ] 완료 자동 정리 동작
- [ ] 백업 / 내보내기 동작

---

## 13. 요약

이 프로젝트의 핵심은 기능을 많이 넣는 것이 아니라, **트레이 팝업 + 위젯 + 저장 + 동기화**의 중심 경험을 먼저 완성하는 것입니다.

그 다음 순서는 아래처럼 유지하는 것이 좋습니다.

1. **앱 골격과 기본 Todo 흐름**
2. **날짜 / 태그 / 우선순위 중심 정리 기능**
3. **위젯 상태 저장과 창 동작 안정화**
4. **상세 편집과 위젯 상세 화면**
5. **데스크톱 작업 허브 기능**
6. **검색 / 반복 / 백업 같은 장기 확장 기능**

이 문서는 이후 실제 구현 시 체크리스트와 작업 순서 기준으로 계속 확장해 사용할 수 있습니다.
