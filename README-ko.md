# Dispensa

[Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)에서 입력창 위 Dock으로 퀵리플라이(`/명령어`·스크립트)를 쓰는 확장. 쉬운 선택지 QR, 메모장, 주제로 HTML 페이지를 만드는 🌟 비주얼라이저, 마리나라 트래커·로어북·캐릭터·연결용 명령 포함. 이름은 이탈리아어 "식료품 저장고". English: [README.md](README.md)

## 설치

1. 서버 `.env`에 `ENABLE_EXTERNAL_EXTENSIONS=true` → 마리나라 재시작
2. **Settings → Addons → External Extensions** → **Allow third-party extension imports** 켜기 → `ME-Dispensa-<버전>.zip` 가져오기
3. **Dispensa** → **Review and Run** → 해시 승인(`SHA256SUMS.txt`와 같아야 함)

[Fetchy](https://github.com/FigCake/ME.Fetchy)에서는 소스 `FigCake/ME.Dispensa` 추가. 권한은 **full_page_access**. 채팅 읽기·쓰기와 AI 호출은 QR 실행 때만, 외부 서버 통신 없음.

## Dock

입력창 왼쪽 ☆ → 위의 `⋯` 손잡이에 마우스를 대거나 터치.

- 버블: 🍰 비주얼라이저 · 📝 메모장 · ⚙ Dispensa 창 · 세트(폴더)와 QR · 🔥 Fornello 버튼 · QR 실행 중엔 중지
- 클릭 = 실행, **Ctrl/⌘+클릭** = 편집, **오른쪽 클릭**(꾹 누르기) = 하위 메뉴
- **Dock** 탭에서 보일 것 고르기(모든 채팅에서 같음): 세트를 폴더나 한 줄로, QR 하나, 그 자리에서 새 QR

Dispensa 창은 상단 바 케이크 → **Dispensa 설정**으로도 열림. 항목 옆 **?**에 설명.

## 보관함과 QR 편집

- **QR 가져오기**: `.mqr.json` · 실리태번 QR 세트(가져올 때 변환). **내보내기**: `.mqr.json`. 복사·붙여넣기·끌어서 순서 바꾸기
- 세트 목록: **전체** · **이 채팅** · **캐릭터** = 자동 실행이 도는 곳. **모든 세트** = 만든 세트 전부
- **새 QR**: **일반 QR**(/명령어·스크립트) · **쉬운 선택지 QR** · **비주얼라이저 QR**
- 편집 화면: 자동완성(`/`, `{{`), 검색되는 명령 목록(표시: Dispensa · 마리나라 · 호환(가져온 QR용) · 명령을 더한 확장 이름), 하위 메뉴, 자동 실행, **▶ 실행**(Ctrl+Enter), 중단점이 있는 **🐞 한 줄씩**

### 쉬운 선택지 QR

카드로 만드는 QR. 단계(선택지·입력)를 차례로 묻고 답(`{{이름}}`)을 넣은 프롬프트 하나를 보냄. 실행·디버그·내보내기는 일반 QR과 같음. **스크립트로 바꾸기**는 스크립트만 남김. **예시 QR** 세트에 **요리와 레시피**·**홀리데이 MD 출시**.

## 🌟 비주얼라이저

- 🍰 → 주제 → **🌟 페이지 만들기**. `[[분위기|밝게|어둡게]]`는 실행할 때 물어봄, `[[메모]]`는 메모 고르기
- **비주얼라이저** 세트: `/visz`로 페이지를 만드는 QR. **마지막 메시지**(마지막 메시지로 새 인터랙티브 장면) · **팬덤 위키**
- 보기 창(Dock 위): 갤러리 · 채팅에 넣기 · HTML/PNG 저장 · 크게 보기. 채팅 속 HTML 코드 블록엔 🌟 버튼
- 스크립트가 도는 풀 페이지는 [Fornello](https://github.com/FigCake/ME.Fornello) 필요(마리나라 CSP가 페이지 스크립트를 막음). 없으면 HTML·CSS만
- 설정(🌟 탭): 결과 보여 줄 곳 · 언어 · AI 연결 · 채팅 RP 프리셋 같이 보내기 · 본체(조각별 켜기·편집·순서)

## 📝 메모장

- 넣기: 채팅 글 긁기 → **메모하기** · 📝 버블 · 📝 탭에 여러 개 붙여넣기(OOC 포장은 벗김)
- 메모는 내용만으로 충분. 제목(선택)을 적으면 목록에 제목, 마우스를 올리면 내용
- **💬 OOC 보내기**(Ctrl+Enter): 결과물 받기(캐릭터 메시지로) · 전개에 반영하기(`/guided`) · 직접 보내기 · 입력창에 넣기
- 꺼내 쓰기: 🌟 주제 칸 · `[[메모]]` · 스크립트(`/memo`)

## 메시지 번호와 변수

- 메시지는 1번부터. 0번부터 세는 실리태번 QR은 가져올 때 한 번 변환. 못 바꾸는 QR은 0번부터 그대로(편집 화면에 이유)
- 채팅 변수는 이름·값이 맞으면 마리나라 채팅 변수로 → 프롬프트·로어북의 `{{getvar::이름}}`에서도 보임

## 명령

모든 명령과 인자는 편집 화면의 명령 목록에서 검색. Dispensa·마리나라 명령:

| 분류 | 명령 |
|---|---|
| 트래커 | `/tracker-get` `/tracker-set` `/tracker-add` `/agents-retry` (경로: `date`, `world.칸`, `custom.칸`, `persona.수치`, `char.캐릭터.칸`, `status`…) |
| 로어북·페르소나·연결 | `/lore-books` `/lore-list` `/persona-get` `/connection` `/connections` `/peek-prompt` `/reload-page` |
| 글자·데이터 | `/trim` `/split` `/join` `/json-get` `/json-set` `/json-keys` `/randompick` `/date` `/count` `/isempty` |
| 입력 | `/form` `/pick` `/confirm` `/notify` `/wait-reply` |
| Dock·비주얼라이저·메모장 | `/dock` `/dock-layout` `/qr-later` `/visz` `/memo` `/memo-add` `/memo-list` `/randomchar` |
| 마리나라 명령 | `/guided` `/as` `/impersonate` `/illustrate` `/selfie` `/video` `/emote` `/roll` `/remind` `/scene` `/status` `/goto` `/random` `/impersonate_prompt` |


## 라이선스와 출처

- Dispensa: [GNU AGPL-3.0](LICENSE). Copyright (C) 2026 FigCake
- STscript 해석기는 [SillyTavern](https://github.com/SillyTavern/SillyTavern)(AGPL-3.0)의 소스와 동작을, 마리나라 연동은 [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)(AGPL-3.0)의 API와 동작을 따름. 두 프로젝트의 파생물로 보고 같은 라이선스 사용
- 전체 소스: 배포 저장소의 `ME-Dispensa-<버전>-source.zip`. 고쳐서 배포하거나 서비스로 제공하면 고친 소스도 AGPL-3.0으로 공개
- 🌟 슈퍼비즈 비주얼라이저 문구(`src/visz/superviz.ts`의 글), 마지막 메시지 QR의 문구(`src/visz/last-message.ts`), 예시 QR 요리와 레시피·홀리데이 MD 출시의 프롬프트(`src/qr/examples.ts`): Copyright (C) 2026 FigCake, 코드와 별도로 [CC BY-NC-SA 4.0](LICENSE-SUPERVIZ.txt). 출처 표시 시 공유·수정 가능, 상업적 이용 불가, 수정본도 같은 조건. 코드가 아니라 AI에게 보내는 글. 기본 QR과 다른 예시를 포함한 나머지는 모두 AGPL-3.0
- 아이콘: [Lucide](https://lucide.dev)(ISC). 이미지 저장: [html-to-image](https://github.com/bubkoo/html-to-image)(MIT). 라이선스 전문은 `THIRD_PARTY_NOTICES.txt`와 `extension.js` 끝에
