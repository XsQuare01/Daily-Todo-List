# Daily Todo List — Electron 앱 설계 문서

**날짜:** 2026-04-09  
**상태:** 승인됨

---

## 개요

Electron 기반의 데스크톱 할 일 관리 앱. 사이드바 + 목록 레이아웃으로 날짜/카테고리별 투두를 관리하며, 데이터는 로컬 JSON 파일에 영속적으로 저장된다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 플랫폼 | Electron (electron-vite) | Main/Preload/Renderer 구조 자동 분리, HMR 지원 |
| UI 프레임워크 | React 18 + TypeScript | 생태계, 타입 안전성 |
| 빌드 도구 | Vite | 빠른 HMR, electron-vite와 통합 |
| 스타일링 | Tailwind CSS | 유틸리티 클래스 기반, 빠른 스타일링 |
| 데이터 저장 | JSON 파일 (로컬 파일시스템) | 영속성 보장, 백업 가능 |

---

## 아키텍처

### 프로세스 구조

```
Main Process (Node.js)
  └── 윈도우 생성, 생명주기 관리
  └── IPC 핸들러: todos 읽기/쓰기
  └── 저장 위치: app.getPath('userData')/todos.json

Preload Script (contextBridge)
  └── window.api.getTodos() → Main에 IPC 요청
  └── window.api.saveTodos(todos) → Main에 IPC 요청

Renderer (React + Vite)
  └── App.tsx (루트)
  └── Sidebar 컴포넌트
  └── TodoList 컴포넌트
  └── TodoItem 컴포넌트
  └── AddTodoInput 컴포넌트
```

### 디렉토리 구조

```
daily-todo-list/
├── src/
│   ├── main/
│   │   └── index.ts          # Electron 메인 프로세스
│   ├── preload/
│   │   └── index.ts          # IPC 브릿지
│   └── renderer/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TodoList.tsx
│       │   │   ├── TodoItem.tsx
│       │   │   └── AddTodoInput.tsx
│       │   ├── types/
│       │   │   └── todo.ts   # Todo 타입 정의
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── index.html
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 데이터 모델

```typescript
interface Todo {
  id: string           // UUID
  title: string        // 할 일 내용
  completed: boolean   // 완료 여부
  important: boolean   // 중요 여부
  createdAt: string    // ISO 날짜 문자열 (오늘 필터링 기준)
}
```

저장 형식: `todos.json` — `Todo[]` 배열을 JSON으로 직렬화

---

## UI 레이아웃

```
┌──────────────┬──────────────────────────────┐
│  사이드바     │  메인 콘텐츠                  │
│              │                              │
│  📅 오늘     │  오늘의 할 일                 │
│  📋 전체     │  ☐ 디자인 시안 검토           │
│  ⭐ 중요     │  ☑ 코드 리뷰 (완료)           │
│  ✅ 완료     │  ☐ 미팅 준비                 │
│              │                              │
│              │  + 할 일 추가...             │
└──────────────┴──────────────────────────────┘
```

### 사이드바 필터
- **오늘**: `createdAt` 날짜가 오늘인 항목
- **전체**: 완료되지 않은 모든 항목
- **중요**: `important === true`인 항목
- **완료**: `completed === true`인 항목

---

## IPC 통신

| 채널 | 방향 | 설명 |
|---|---|---|
| `todos:get` | renderer → main | todos.json 읽기 요청 |
| `todos:save` | renderer → main | todos.json 쓰기 요청 |

---

## MVP 핵심 기능

1. 할 일 추가 (Enter 키 또는 버튼)
2. 완료 체크/해제
3. 중요 표시 토글
4. 할 일 삭제
5. 사이드바 카테고리 필터
6. 데이터 자동 저장 (상태 변경 시 즉시 저장)

---

## 범위 외 (MVP 이후)

- 마감일 설정
- 드래그 앤 드롭 순서 변경
- 알림/리마인더
- 다크/라이트 모드 전환
- 클라우드 동기화
