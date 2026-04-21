# Windows 릴리스 운영 절차

## 1) 버전 확인

- `package.json` 버전을 확인하고 필요하면 먼저 버전을 올린다.

## 2) 검증

```bash
npm run typecheck
npm run test
```

## 3) Windows 설치 파일 생성

```bash
npm run build:win
```

- 결과물은 `dist/` 에 생성된다.

## 4) 로컬 설치 파일 확인

- 생성된 설치 파일을 설치한다.
- 앱이 정상 실행되는지 확인한다.
- 트레이 메뉴에서 **"시작 시 자동 실행"** 이 기본값으로 꺼져 있는지 확인한다.
- 필요할 때만 트레이 메뉴에서 자동 시작을 켠다.

## 5) Git 태그 생성

- `package.json` 버전과 같은 값으로 Git 태그를 만든다.

```bash
git tag v<package.json 버전>
git push origin v<package.json 버전>
```

## 6) GitHub Release 업로드

- 위 태그 기준으로 GitHub Release를 만든다.
- `dist/`의 설치 파일과 산출물을 첨부한다.
- 릴리스 노트에 버전 정보를 맞춰 적는다.
