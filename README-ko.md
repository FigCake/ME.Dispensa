# Dispensa

[Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)에서 입력창 위 Dock으로 퀵리플라이(`/명령어`·스크립트)를 쓰는 확장. 쉬운 선택지 QR, 메모장과 메모 보드, 주제로 HTML 페이지를 만드는 🌟 비주얼라이저, 마리나라 트래커·로어북·캐릭터·연결용 명령 포함. 이름은 이탈리아어 "식료품 저장고". English: [README.md](README.md)

## 설치

1. 서버 `.env`에 `ENABLE_EXTERNAL_EXTENSIONS=true` → 마리나라 재시작
2. **Settings → Addons → External Extensions** → **Allow third-party extension imports** 켜기 → `ME-Dispensa-<버전>.zip` 가져오기
3. **Dispensa** → **Review and Run** → 해시 승인(`SHA256SUMS.txt`와 같아야 함)

[Fetchy](https://github.com/FigCake/ME.Fetchy)에서는 `FigCake/ME.Dispensa` 추가. 권한은 **full_page_access**. 채팅 읽기·쓰기와 AI 호출은 QR 실행 때만, 외부 서버 통신 없음.

## Dock

입력창 왼쪽 ☆ → 위의 `⋯` 손잡이에 마우스를 대거나 터치.

- 버블: 🍰 비주얼라이저 · 📝 메모장 · ⚙ Dispensa 창 · 세트와 QR · 🔥 Fornello 버튼 · QR 실행 중엔 중지
- 클릭 = 실행, **Ctrl/⌘+클릭** = 편집, **오른쪽 클릭**(꾹 누르기) = 하위 메뉴
- QR 보관함에서 세트는 "Dock에 놓기"(폴더/한 줄), QR은 "Dock에 따로 놓기"로 올림(모든 채팅에서 같음). 순서와 🍰·📝 버블은 창의 ⚙

마리나라 상단 바 케이크 → **📚 QR 보관함** · **📋 메모 보드** · **🖼 갤러리**로 Dispensa 창이 그 탭으로 열림. 탭과 도구는 아이콘(마우스를 대면 이름), 항목 옆 **?**에 설명. 창 위 **⚙** = Dispensa 설정(폰에선 전체 화면): 페이지·OOC 결과물·갤러리 실행이 쓰는 AI 연결과 채팅 RP 프리셋 같이 보내기(로어북·서사 요약은 늘 들어감), Dock 순서와 버블. QR의 `/gen`은 채팅 연결을 그대로 씀

## 보관함과 QR 편집

- **가져오기**: `.mqr.json` · 실리태번 QR 세트(변환). **내보내기**: `.mqr.json`. 복사·붙여넣기·끌어서 순서 바꾸기
- **전체** · **이 채팅** · **캐릭터** = 자동 실행이 도는 곳. **모든 세트** = 세트 전부
- **새 QR**: **일반 QR**(/명령어·스크립트) · **쉬운 선택지 QR** · **비주얼라이저 QR**
- 편집 화면: 자동완성(`/`, `{{`), 검색되는 명령 목록, 하위 메뉴, 자동 실행, **▶ 실행**(Ctrl+Enter), 중단점이 있는 **🐞 한 줄씩**

### 쉬운 선택지 QR

단계(선택지·입력)를 차례로 묻고 답(`{{이름}}`)을 넣은 프롬프트 하나를 보내는 카드형 QR. **스크립트로 바꾸기**는 스크립트만 남김. **예시 QR** 세트: **요리와 레시피** · **홀리데이 MD 출시**.

## 🌟 비주얼라이저

- 🍰 → 주제 → **🌟 페이지 만들기**. `[[분위기|밝게|어둡게]]`는 실행할 때 물어봄, `[[메모]]`는 메모 고르기
- **비주얼라이저** 세트: `/visz`로 만드는 **마지막 메시지**(마지막 메시지로 인터랙티브 장면) · **팬덤 위키**
- 보기 창(Dock 위): 채팅에 넣기 · HTML/PNG 저장 · 크게 보기. 채팅 속 HTML 코드 블록엔 🌟 버튼
- 갤러리(🍰 → 🖼, 또는 창의 🖼 탭): 목록 또는 페이지 그림 카드(▦) · 폴더 · 찾기 · ☑로 여러 개 옮기기·지우기 · 📋로 메모 보드에 붙이기. ⚙ = 저장할 결과(현재 채팅 메시지만 · 갤러리 실행만 · 전체)와 HTML만 저장. 보기 창의 ☆는 늘 저장. 페이지는 마리나라 서버(게임 에셋 폴더의 `dispensa/gallery`)에 저장돼 다른 기기에서도 보임
- **▶**(갤러리): 아무 QR이나 갤러리용으로 실행. 채팅엔 아무것도 안 가고, 채팅이 답하는 동안에도 돌아감. "갤러리 실행용 AI"(⚙)로, 채팅의 카드·페르소나·메시지·프리셋·로어북·서사 요약을 담아
- [Fornello](https://github.com/FigCake/ME.Fornello)가 있으면 스크립트가 도는 풀 페이지, 없으면 HTML·CSS만(마리나라 CSP가 페이지 스크립트를 막음). Fornello 캐릭터 에셋을 쓰면 페이지의 `{{raw::이름}}`·`[img:이름]`이 채팅 캐릭터의 그림으로 보이고(보기 창·갤러리도), 스크립트에서 `/asset`·`/assets`를 쓸 수 있음
- 설정(QR 보관함 세트 목록 아래 **비주얼라이저**): 언어 · 결과물 보낼 곳(보기 창 · 현재 채팅 · 갤러리) · 풀 페이지(끄면 Fornello가 있어도 HTML·CSS만) · 외부 자료 · 본체(조각별 켜기·편집·순서) · 내보내기·가져오기(.visz.json)

## 📝 메모장

- 넣기: 채팅 글 긁기 → **메모하기** · 📝 버블 · 📝 탭에 여러 개 붙여넣기(OOC 포장은 벗김)
- 제목(선택)은 목록에, 내용은 마우스를 올리면
- **💬 OOC 보내기**(Ctrl+Enter): 캐릭터 메시지로 받기 · 전개에 반영(`/guided`) · 직접 보내기 · 입력창에 넣기
- 꺼내 쓰기: 🌟 주제 칸 · `[[메모]]` · `/memo`
- 보이는 곳: 🌐 모든 채팅 · 👤 이 캐릭터의 채팅 · 📍 이 채팅. 새 메모가 갈 곳은 📝 탭에서, 메모의 단추로 옮기기
- 꾸며서 보여 줌: 마크다운(제목 · **굵게** · *기울임* · ~~취소선~~ · `코드` · 목록 · 체크박스)과 `<u>` · `<span style="color · font-size · font-family">`, 서식 단추로 쓰기. OOC · 입력창 · 페이지 · 스크립트에는 태그를 뺀 글
- ⋯ → 복제. 지우면 알림에서 되돌리기
- 📝 버블: 이 채팅에서 보이는 메모 중 최근 4개와 📌 고정. `/memo-list chat` · `character` · `global`로 한 곳만
- 📝 버블의 📋 탭: 메모 보드 목록, 누르면 Dispensa 창에서 열림

### 📋 보드

Dispensa 창 → 📋: 메모를 코르크판처럼 늘어놓기.

- 카드는 메모 그 자체(어느 쪽을 고쳐도 같이 바뀜)이고 꾸밈도 그대로. 메모 하나를 여러 보드에(⋯ → 보드에 놓기)
- 끌어서 옮기기. 폰에서는 톡 = 크게 보기, 꾹 = 집기(끌기 · 모서리로 크기 · 위 손잡이로 돌리기). 판을 끌어 이동, 휠이나 두 손가락으로 확대
- 마그넷·배경 그림은 마리나라 전역 갤러리("Dispensa" 폴더)에 저장돼 다른 기기에서도 보임
- **구획 배치**(▦): 2~6칸 틀. ⠿로 옮기기, ⇥ ⤓ 합치기, ⇤ ⤒ 나누기, 빈 구획엔 메모나 그림
- 💬로 보드를 위에서부터 보내기. 카드 번호는 그 순서(⋯ → 카드 번호 빼기)
- 🎨 **테마**: 12개(웜 워크스페이스 · 벤토 · 에디토리얼 세리프 · 다크 테크 · 가이드 시트 · 듀오톤 · 키네틱 타이포 · 건축 도면 · 팝 스티커 · 코티지 스크랩북 · 클린 뉴트럴 · 린넨 저널)에서 시작해 색 7가지, 제목·카드 글꼴(설치한 글꼴 포함), 모서리, 그림자, 바탕 무늬, 기울기 바꾸기. **고급**에서 CSS 직접 쓰기(그 보드 안에만 적용)
- 💾 **이 모양 저장** = **내 테마**에 남기기. ⬇ `.board-theme.json` 파일로 저장해 공유, ⬆ 불러오기
- 갤러리와 함께: 보드에 붙인 페이지는 그 그림(톡 누르면 페이지 열기). 카드 ⋯나 💬 → **🖼 갤러리용 QR 실행** = 그 메모나 보드 전체를 소재로 QR 실행

## 메시지 번호와 변수

- 메시지는 1번부터. 0번부터 세는 실리태번 QR은 가져올 때 한 번 변환, 못 바꾸는 QR은 0번부터 그대로(편집 화면에 이유)
- 채팅 변수는 맞으면 마리나라 채팅 변수로도 → 프롬프트·로어북의 `{{getvar::이름}}`에서 보임

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
