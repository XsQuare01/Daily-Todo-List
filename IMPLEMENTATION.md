# Daily Todo List — 구현 문서

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처](#3-아키텍처)
4. [데이터 모델](#4-데이터-모델)
5. [창 구성](#5-창-구성)
6. [기능 상세](#6-기능-상세)
7. [IPC 통신](#7-ipc-통신)
8. [데이터 저장](#8-데이터-저장)
9. [전역 단축키](#9-전역-단축키)
10. [파일 구조](#10-파일-구조)

---

## 1. 프로젝트 개요

Windows 데스크톱용 Todo 관리 앱. 시스템 트레이에 상주하며 팝업·위젯·데스크톱 세 가지 뷰를 제공한다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Electron |
| UI | React + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 빌드 | Vite + electron-vite |
| 아이콘 | lucide-react |
| 드래그 앤 드롭 | @dnd-kit/core |

---

## 3. 아키텍처

```
Main Process (Node.js)
├── todos-store.ts      — todos.json 읽기/쓰기, IPC 핸들러 등록, 전체 창 브로드캐스트
├── settings-store.ts   — settings.json 읽기/쓰기 (위젯 위치·크기, 클릭통과 등)
└── index.ts            — 창 생성·관리, 트레이, 전역 단축키

Renderer Process (React)
├── App.tsx             — 팝업 / 데스크톱 뷰
├── WidgetView.tsx      — 위젯 뷰
└── hooks/useTodos.ts   — Todo CRUD 상태 관리

Preload (window.api)
└── IPC 브릿지 — getTodos, saveTodos, hideWindow, openDesktopApp,
                 getNetworkDate, onTodosUpdated, onFocusAdd, openExternal
```

변경 사항 저장 시 메인 프로세스가 **모든 열린 창에 `todos:updated` 이벤트를 브로드캐스트**하여 팝업·위젯·데스크톱이 항상 동일한 데이터를 표시한다.

---

## 4. 데이터 모델

### Todo

```typescript
interface Todo {
  id: string           // crypto.randomUUID()
  title: string
  description?: string
  completed: boolean
  important: boolean
  createdAt: string    // "YYYY-MM-DD" (KST)
  dueDate?: string     // "YYYY-MM-DD"
  tags?: string[]      // e.g. ["work", "urgent"]
  elapsedMs?: number   // 스톱워치 누적 밀리초
  priority?: Priority  // "high" | "medium" | "low"
  subtasks?: Subtask[]
  link?: string        // 외부 URL (PR, Issue 등)
}
```

### Subtask

```typescript
interface Subtask {
  id: string           // crypto.randomUUID()
  title: string
  completed: boolean
}
```

### Priority

```
high   — 빨강 (D-Day 우선 표시)
medium — 노랑
low    — 파랑
```

---

## 5. 창 구성

### 5-1. 팝업 창 (mainWindow)

| 항목 | 값 |
|------|-----|
| 크기 | 360 × 560 px (고정) |
| 위치 | 화면 우측 하단 (트레이 근처) |
| 프레임 | 없음 (frameless) |
| 동작 | 포커스 잃으면 자동 숨김 (프로덕션 한정) |

트레이 아이콘 클릭 시 표시/숨김 토글. 표시 중이고 포커스 상태면 숨기고 위젯 복원.

### 5-2. 데스크톱 창 (desktopWindow)

| 항목 | 값 |
|------|-----|
| 크기 | 화면 크기에 따라 동적 계산 (최소 1280×720) |
| 프레임 | 없음 |
| 리사이즈 | 가능 |
| 태스크바 | 표시됨 |

관리 전용 대형 화면. 팝업·위젯과 달리 닫아도 숨겨질 뿐 종료되지 않는다.

### 5-3. 위젯 창 (widgetWindow)

| 항목 | 값 |
|------|-----|
| 기본 크기 | 236 × 124 px |
| 최소 크기 | 220 × 112 px |
| 최대 크기 | 800 × 900 px |
| 배경 | 완전 투명 |
| 항상 위 | 활성화 |
| 리사이즈 | 가능 |
| 태스크바 | 숨김 |

- 드래그 후 화면 가장자리 **24 px 이내**면 **12 px 여백으로 스냅**
- 위치·크기를 `settings.json`에 자동 저장, 앱 재시작 시 복원
- 클릭 통과(click-through) 모드 지원: 마우스 이벤트를 하위 창에 전달

### 5-4. 태그 위젯 (extraWidgets)

트레이 메뉴 → "태그 위젯 추가" → 태그 선택 시 생성되는 추가 위젯.  
widgetWindow와 동일한 구조이나 특정 태그로 필터링된 할 일만 표시.  
위치·크기가 `settings.json`의 `extraWidgets[]`에 개별 저장됨.

---

## 6. 기능 상세

### 6-1. 팝업 뷰 (App.tsx)

#### 필터 탭

| 키 | 라벨 | 표시 조건 |
|----|------|-----------|
| `today` | 날짜 | 선택된 날짜의 모든 할 일 |
| `all` | 전체 | 미완료 전체 |
| `important` | 중요 | 중요 + 미완료 |
| `completed` | 완료 | 완료된 항목 |
| `tag` | 태그 | 선택 태그 + 미완료 |

#### 날짜 네비게이터

`today` 필터 활성 시 표시. `◀` / `▶` 버튼으로 날짜 이동. 오늘 날짜는 "오늘" 뱃지 표시.

#### 태그 선택기

`tag` 필터 활성 시 표시. 모든 태그를 버튼으로 나열, 클릭 시 해당 태그로 필터링.

#### 할 일 추가 (AddTodoInput)

- `#태그명` 문법으로 입력 시 태그 자동 파싱
- `Ctrl+Shift+N` 전역 단축키로 팝업을 열고 입력창에 포커스

### 6-2. Todo 항목 (TodoItem.tsx)

#### 접힌 상태

- 체크박스 (클릭 시 완료 토글)
- 우선순위 색상 점
- 제목 (D-Day 뱃지, 외부 링크 버튼, 스톱워치 경과 시간)
- 서브태스크 진행률 바 (있을 경우)
- 호버 시: 타이머 버튼, 중요 버튼(별), 삭제 버튼

#### 펼친 상태 (제목 클릭)

| 필드 | 설명 |
|------|------|
| 메모 | 여러 줄 텍스트, blur 시 저장 |
| 우선순위 | 상(high) / 중(medium) / 하(low) 토글 버튼 |
| 마감일 | date 입력, D-Day 자동 계산 |
| 태그 | 쉼표 구분 입력, blur 시 저장 |
| 링크 | URL 입력, 외부 브라우저 열기 |
| 타이머 | 경과 시간 + 초기화 버튼 |
| 하위 항목 | 서브태스크 목록 + 추가 입력 |

#### 스톱워치

- 항목당 독립 타이머, 동시에 하나만 실행
- 다른 항목 타이머 시작 시 이전 타이머 자동 일시정지
- 완료 처리 시 실행 중 타이머 자동 정지
- 누적 시간 `elapsedMs`에 저장

#### 드래그 앤 드롭 (dnd-kit)

`@dnd-kit/core` 기반. 동일 리스트 내 수직 정렬 변경 가능.

### 6-3. 데스크톱 뷰 (App.tsx — mode=desktop)

- **Pending Lane / Important Lane** 2열 레이아웃
- **Focus Session 패널**: 중요 → 미완료 순으로 상위 5개 제안, 타이머 실행
- **다중 선택**: 체크박스로 항목 복수 선택
- **일괄 작업**: 완료 처리 / 중요 표시 / 중요 해제 / 삭제

### 6-4. 위젯 뷰 (WidgetView.tsx)

#### 목록 화면

- 오늘 날짜의 미완료 할 일을 **우선순위 순** (high → medium → low → 없음) 으로 정렬해 전체 표시
- 스크롤 가능 (scrollbar 숨김)
- 서브태스크 있는 항목은 `완료수/전체수` 표시
- 우클릭 컨텍스트 메뉴 → 할 일 추가
- 태그 위젯은 URL 쿼리 `?tag=xxx`로 필터링

#### 상세 화면 (할 일 클릭)

| 요소 | 설명 |
|------|------|
| `←` 버튼 | 목록으로 복귀 |
| 제목 | 16px 굵은 텍스트 |
| 우선순위 뱃지 | 색상 점 + 높음/보통/낮음 |
| 마감일 | YYYY-MM-DD |
| 설명 | 있을 경우 표시 |
| 태그 | `#태그` 형태 |
| 링크 | 클릭 시 외부 브라우저 |
| 하위 항목 | 토글 + 입력창으로 추가, `Enter` 확정 |
| 완료로 표시 | 클릭 시 완료 처리 후 목록 복귀 |

#### 위젯 크기 표준 (1.25× 스케일)

| 요소 | 크기 |
|------|------|
| 헤더·컨텍스트 메뉴 텍스트 | 14px |
| 목록 항목 텍스트 | 15px |
| 상세 제목 | 16px |
| 메타 정보(우선순위·날짜·태그·링크) | 13px |
| 서브태스크 텍스트 | 14px |
| 완료 버튼 / 추가 입력창 높이 | 35px |
| 헤더 버튼 크기 | 25×25px |

---

## 7. IPC 통신

| 채널 | 방향 | 설명 |
|------|------|------|
| `todos:get` | Renderer → Main | 전체 Todo JSON 요청 |
| `todos:save` | Renderer → Main | Todo JSON 저장 + 전체 창 브로드캐스트 |
| `todos:updated` | Main → Renderer | 저장 후 모든 창에 최신 데이터 푸시 |
| `window:hide` | Renderer → Main | 현재 창 숨기기 |
| `desktop:open` | Renderer → Main | 데스크톱 창 열기 |
| `link:open-external` | Renderer → Main | 외부 URL을 시스템 브라우저로 열기 |
| `date:get-network` | Renderer → Main | 네트워크 KST 날짜 조회 |
| `app:focus-add` | Main → Renderer | 할 일 입력창 포커스 |

---

## 8. 데이터 저장

모든 파일은 Electron `userData` 디렉터리에 저장된다.  
Windows 기준: `%APPDATA%\daily-todo-list\`

### todos.json

Todo 배열을 JSON으로 직렬화.

```json
[
  {
    "id": "uuid",
    "title": "할 일 제목",
    "completed": false,
    "important": false,
    "createdAt": "2026-04-25",
    "priority": "high",
    "tags": ["work"],
    "subtasks": [
      { "id": "uuid", "title": "서브태스크", "completed": false }
    ]
  }
]
```

### settings.json

```json
{
  "widget": { "x": 1200, "y": 800, "width": 236, "height": 124 },
  "clickThrough": false,
  "extraWidgets": [
    {
      "id": "uuid",
      "tag": "work",
      "bounds": { "x": 1100, "y": 80, "width": 236, "height": 124 }
    }
  ]
}
```

### 네트워크 날짜

KST 기준 오늘 날짜를 두 API에서 순차적으로 시도:
1. `https://worldtimeapi.org/api/timezone/Asia/Seoul`
2. `https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul`

모두 실패 시 로컬 시스템 시간을 KST 오프셋(+9h)으로 계산한 날짜 사용.

---

## 9. 전역 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+Shift+D` | 위젯 표시 / 숨김 토글 |
| `Ctrl+Shift+N` | 팝업 열기 + 할 일 입력창 포커스 |
| `Ctrl+Shift+M` | 데스크톱 앱 열기 |

---

## 10. 파일 구조

```
src/
├── main/
│   ├── index.ts            — 앱 진입점, 창·트레이·단축키 관리
│   ├── todos-store.ts      — Todo IPC 핸들러 및 파일 I/O
│   └── settings-store.ts   — 설정 파일 I/O
├── preload/
│   ├── index.ts            — contextBridge로 window.api 노출
│   └── index.d.ts          — window.api 타입 선언
├── renderer/src/
│   ├── App.tsx             — 팝업 / 데스크톱 뷰
│   ├── WidgetView.tsx      — 위젯 뷰
│   ├── main.tsx            — React 루트 (mode 쿼리로 뷰 분기)
│   ├── components/
│   │   ├── TodoItem.tsx    — 단일 Todo 항목 UI
│   │   ├── TodoList.tsx    — dnd-kit 기반 정렬 가능 목록
│   │   └── AddTodoInput.tsx — 하단 입력창
│   ├── hooks/
│   │   └── useTodos.ts     — Todo CRUD + 서브태스크 상태 훅
│   ├── lib/
│   │   ├── todos-ipc.ts    — IPC 래퍼 (load/persist/subscribe/create)
│   │   ├── todo-input.ts   — 입력 파싱 (#태그 추출)
│   │   ├── filters.ts      — 필터 탭 설정
│   │   ├── date.ts         — KST 날짜 유틸
│   │   └── utils.ts        — cn() 클래스 유틸
│   └── types/
│       └── todo.ts         — Todo / Subtask / Priority / FilterType 타입
└── shared/
    └── window-api.ts       — WindowApi 인터페이스 정의
```
