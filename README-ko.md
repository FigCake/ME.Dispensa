# Dispensa

[Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)용 퀵리플라이(QR) 확장. 이름은 이탈리아어로 "식료품 저장고". English: [README.md](README.md)

## 기능

- 입력창 위 아이콘 버블 **Dock**
- 실리태번 QR(STscript) 그대로 실행
- 자동 실행 · 하위 메뉴 · 채팅/캐릭터 전용 세트 · 자동완성과 디버거가 있는 편집기
- QR에서 마리나라 기능 사용: 트래커 · 로어북 · 캐릭터 카드 · AI 연결 · 작가 노트
- **📝 메모장**: 채팅 글 모으기 → OOC 보내기 · 🌟 페이지 소재
- **🌟 비주얼라이저**: 슈퍼비즈 문구로 HTML 페이지 만들기
- 화면 언어: English · 한국어(Dispensa 창의 🌐, 기본은 마리나라 언어 따르기. Fornello와 같은 설정)

## 설치

1. 마리나라 서버 `.env`에 `ENABLE_EXTERNAL_EXTENSIONS=true` 넣고 서버 재시작
2. **Settings → Addons → External Extensions** → **Allow third-party extension imports** 켜기 → `ME-Dispensa-<버전>.zip`을 **Import Extension File**로 가져오기
3. 목록의 **Dispensa** → **Review and Run** → 코드 확인 후 해시 승인(`SHA256SUMS.txt`와 같아야 함)

[Fetchy](https://github.com/FigCake/ME.Fetchy) 사용 시 `FigCake/ME.Dispensa`를 소스로 추가.

> 권한: **페이지 전체 접근(full_page_access)** — Dock 그리기와 QR 실행용. 채팅 읽기·쓰기와 AI 호출은 **QR 실행 때만**. 외부 서버 통신 없음.

## Dock

입력창 왼쪽 ☆ → `⋯` 손잡이 → 마우스를 대거나 터치하면 버블 표시.

| 버블 | 기능 |
|---|---|
| 🍰 | 비주얼라이저 메뉴 |
| 📝 | 메모장 |
| ⚙ | Dispensa 창(보관함) |
| 세트 · QR | **Dock** 탭에서 넣은 것. 세트는 폴더(누르면 QR 목록) |
| 중지 | QR 실행 중에만 표시 |

| 동작 | 결과 |
|---|---|
| QR 누르기 | 실행 |
| **Ctrl+클릭**(맥 ⌘+클릭) | 편집 화면 |
| **오른쪽 클릭**(휴대폰 꾹 누르기) | 하위 메뉴 |

- 모든 채팅에서 같은 바로가기. 자동 실행 범위와 별개
- 한 줄 8개, 넘치면 다음 줄
- 아이콘: 세트·QR마다 이모지(비우면 이름의 첫 이모지나 첫 글자)

### Dock 탭 (Dispensa 창)

| 버튼 | 기능 |
|---|---|
| **+ 세트** | 세트 넣기. 옆에서 **폴더**(버블 하나) / **한 줄**(QR마다 버블, Dock 한 줄) 선택 |
| **+ QR** | 보관함의 QR 하나를 버블로 |
| **새 QR** | 여기서 바로 만들기: **명령·스크립트** · **OOC** · **비주얼라이저**. 'Dock' 세트에 저장(전체 범위라 자동 실행 가능) |
| ⠿ | 끌어서 순서 바꾸기 |
| ✕ | Dock에서 빼기(세트·QR은 그대로) |

예: `/pg-translate`(Polyglot: 마지막 답변 문단 번역)를 새 QR로 만들고 아이콘 지정 → 버블 한 칸. 자동 실행 **AI 답변 뒤**를 켜면 매 답변마다, 끄면 클릭할 때만.

## 보관함

Dock ⚙로 열기. 항목 옆 **?**에 설명.

| 버튼 | 기능 |
|---|---|
| **QR 가져오기** | 실리태번 QR 세트 JSON(여러 개 가능). QR 하나짜리 파일은 열린 세트로 |
| **새 세트** · **새 QR** | 새로 만들기(새 QR: 명령·스크립트 · OOC · 비주얼라이저) |
| **내보내기** | `.qr.json`(실리태번용, 번호·명령을 실리태번 기준으로) · `.mqr.json`(마리나라용, 그대로) |
| **붙여넣기** | 복사한 QR 넣기. 글만 붙이면 그 글을 보내는 QR |
| ⠿ | 끌어서 순서 바꾸기(↑↓ 키도 가능) · 세트는 다른 칸으로 옮기기 |
| ⋯ (세트) | 세트 복제 · 세트 삭제 |
| ⋯ (QR) | 복사 · 잘라내기 · 복제 · 다른 세트로 옮기기/복사 · 이 QR만 내보내기 · 삭제 |

### 세트 목록

실리태번의 세트 목록과 같음. 위 세 칸 = 자동 실행이 도는 곳(Dock과 별개).

| 칸 | 내용 |
|---|---|
| 전체 | 모든 채팅 (실리태번의 글로벌 세트) |
| 이 채팅 | 지금 채팅만 (채팅 세트) |
| 캐릭터: 이름 | 그 캐릭터와의 채팅 (캐릭터 세트) |
| 모든 세트 | 만든 세트 전부 |

- ⠿ 끌기: 모든 세트 → 위 칸 = 넣기 · 위 칸 → 모든 세트 = 빼기 · 위 칸끼리 = 옮기기 · 같은 칸 = 순서
- 한 세트를 여러 칸에 넣기 가능(세트 설정의 **켜는 칸** 스위치)

### 세트 설정

| 항목 | 내용 |
|---|---|
| 켜는 칸 | 자동 실행이 도는 곳: **전체** · **이 채팅** · **캐릭터: 이름** (왼쪽 목록의 칸과 같음) |
| 색 | **색 칠하기** · **테두리만 칠하기** |
| 글 QR 보내는 방식 | '/' 없는 글 QR: **보내지 않기**(입력창에만) · **입력창 글에 붙이기** · **앞에 붙이기** |

### QR 편집 화면

| 항목 | 내용 |
|---|---|
| 아이콘 · 이름 · 설명 | 버블 모양 · 마우스를 올리면 보이는 글 |
| 스크립트 | STscript. `/`, `{{` 입력 시 목록 |
| 명령 목록 | 검색 · 누르면 커서 자리에 삽입. `실리태번` `Dispensa` `마리나라` 표시, 다른 확장이 추가한 명령은 그 확장 이름 (Polyglot의 `/pg-translate`, `/pg-annotate`…) |
| 하위 메뉴 | 다른 세트를 이 QR의 메뉴로 |
| 자동 실행 | 자동 실행할 때 고르기 |
| Dock에서 숨기기 | Dock의 세트 폴더에서 숨김(다른 QR·자동 실행으로는 사용 가능) |
| 아이콘만 보이기 | 폴더·하위 메뉴에서 아이콘만 |

| 버튼 | 기능 |
|---|---|
| **▶ 실행** (Ctrl+Enter) | 저장 없이 실행, 결과는 아래에 |
| **🐞 한 줄씩** | 첫 명령 앞에서 멈춤. 변수·호출 순서 표시 |
| **다음** · **안으로** · **밖으로** · **계속** · **중지** | 다음 명령 · 클로저/`/run` 속으로 · 이 단계 끝까지 · 다음 멈출 곳까지 · 중지 |
| 줄 번호 | 중단점(빨간 점). `/breakpoint`도 같음 |
| **QR 삭제** | 이 QR 삭제 |

- Tab 들여쓰기 · Shift+Tab 내어쓰기 · 줄바꿈 시 들여쓰기 유지
- 실리태번에 없는 명령은 스크립트 아래에 표시

### 하위 메뉴

- 단 세트의 QR이 오른쪽 클릭 메뉴로 열림. 하위 메뉴가 있는 버블엔 작은 줄 표시
- **이어서 실행**: 이 QR을 먼저 실행하고, 고른 QR이 결과(`{{pipe}}`)를 이어받음
- `%%parent%%` = 위 QR 이름, `%%parent-2%%` = 그 위 이름
- 메뉴 안 QR의 하위 메뉴는 ›로 펼침(스크립트가 빈 QR은 눌러도 펼침)
- 자기 세트를 달면 **숨긴 QR 중 아이콘 있는 것**만 표시(실리태번과 같음)

### 자동 실행

| 항목 | 실행 시점 |
|---|---|
| 마리나라를 켤 때 | Dispensa가 켜질 때 |
| 내 메시지를 보낸 뒤 | 내 메시지 저장 뒤 |
| AI 답변 뒤 | AI 답변이 끝난 뒤 |
| 채팅을 열 때 | 다른 채팅으로 옮길 때 |
| 새 채팅을 만들 때 | 새 채팅이 열릴 때 |
| 그룹 채팅에서 캐릭터 차례마다 | 캐릭터마다 답을 쓰기 시작할 때 |
| AI가 답을 쓰기 직전 | 끝날 때까지 답 생성 대기(최대 1분) |
| 로어북 항목이 쓰일 때 | 적어 둔 항목(이름이나 id)이 답변에 쓰일 때(실리태번의 자동화 ID) |
| 자동 실행 연쇄 막기(기본 켜짐) | 이 QR이 다른 QR을 자동 실행하는 것을 막음 |

## 🌟 비주얼라이저

Dock **🍰 버블** → 페이지 만들기 메뉴(OOC는 📝 메모장에서).

| 버튼·칸 | 기능 |
|---|---|
| 주제 칸 | 만들 페이지의 주제. `[[장소]]`, `[[분위기|밝게|어둡게]]` = 실행할 때 물어봄 · `[[메모]]` = 메모장에서 고르기 |
| **🌟 페이지 만들기** (Ctrl+Enter) | 페이지 만들기 |
| **📝 메모장** | 메모를 주제 칸에 넣기(여러 개 가능) |
| ☆ | 주제를 메모장에 저장 |
| **항목** 탭 | 보관함 **비주얼라이저** 세트의 QR |
| **갤러리** 탭 | 만든 페이지 모음. 누르면 보기 창 |

- **비주얼라이저** 세트: `/visz`로 페이지를 만드는 보통 QR
  - **슈퍼비즈**: 주제를 물어서 만들기(`/visz [[만들 페이지의 주제]]`)
  - **마지막 메시지로**: 마지막 메시지의 장면으로(`/visz … {{lastMessage}}`)
  - **메모로**: 메모장에서 고른 메모로(`/visz [[메모]]`)
- 페이지 주제 글은 메모장에 보관

### 보기 창

| 버튼 | 기능 |
|---|---|
| ☆ | 갤러리에 저장 |
| ➤ | 채팅에 캐릭터 메시지로 넣기 |
| ⤓ | HTML 파일로 받기 |
| 🖼 | 이미지(PNG)로 저장 |
| ⛶ | 크게 보기(작게 보기·Esc로 복귀) |
| 🗑 | 갤러리에서 삭제(갤러리에서 연 페이지만) |
| **이어 쓰기** | HTML이 끊겼을 때 표시(먼저 두 번까지 자동으로 이어 씀) |
| ✕ | 닫기 |

- 채팅 속 HTML 코드 블록에 **🌟 보기** 버튼

### 설정 (Dispensa 창 🌟 탭)

| 항목 | 내용 |
|---|---|
| 모드 | **자동**(Fornello 있으면 풀, 없으면 라이트) · **풀**(스크립트 페이지, [Fornello](https://github.com/FigCake/ME.Fornello) 필요) · **라이트**(HTML·CSS만) |
| 결과를 보여 줄 곳 | **보기 창** · **채팅**(바로 캐릭터 메시지로) |
| 결과 언어 | 페이지 글의 언어 |
| 채팅에 올린 페이지도 갤러리에 | 채팅으로 보낸 페이지도 갤러리에 |
| 바깥 자료 불러오기 허용 | 보기 창 페이지의 인터넷 글꼴·그림 허용 |
| AI 연결 | 비주얼라이저 전용 연결(보조 모델) |
| Dock 버블 | 🍰 버블 표시·아이콘 |
| 본체 | AI에게 보내는 지침(아래) |

- 마리나라 CSP가 페이지 속 스크립트를 막음 → Fornello 없으면 HTML·CSS만(**스크립트 꺼짐** 표시). Fornello가 있으면 **▶ 실행**으로 스크립트까지

### 본체와 감싸개

- **본체**: 슈퍼비즈 문구를 나눈 조각. 켜기·끄기 · 편집 · 순서 바꾸기 · **조각 추가** · **기본값으로**
- **Fornello 명령어** 조각: Fornello + 풀 모드일 때만. 페이지 명령어(`genChat`, `setLore`, `setTracker` 등)와 규칙 → 캐릭터가 실제로 답하는 DM·SNS 페이지. 페이지 속 일은 요약해 이 채팅 로어북(`"@chat"`)에, 호감도 같은 숫자는 트래커에
- 원래 슈퍼비즈에 더한 줄: 풀 모드 — 어울리는 구글 웹폰트 · 비동기 오류를 페이지에 표시 / 두 모드 — 중요한 그림은 SVG, 작은 아이콘만 이모지. 손대지 않은 옛 조각은 새 문구로, 고친 조각은 그대로
- **감싸개**: 💬 OOC에 씌우는 틀(`<System>` 블록, `((OOC: …))` 등). 📝 탭에서 편집
- **백업**: 본체·감싸개·기본값 → `.wand.json`
- 갤러리: 이 브라우저에만 저장
- 다른 QR에서: `/visz 주제` · `/visz output=chat 주제`

## 📝 메모장

OOC·페이지 소재 모음(스크립트·세트 없는 글).

| 넣는 법 | |
|---|---|
| 채팅 글 긁기 | 옆의 **메모하기** 버튼 |
| 📝 버블 | 칸에 적고 ☆ |
| 📝 탭 | **새 메모** · **여러 개 넣기**(한꺼번에 붙여넣기) |

- `*{OOC: …}*`, `[OOC: …]`, `(OOC: …)` 포장은 벗기고 내용만. 여러 개면 하나씩 나눔

| 버튼 | 기능 |
|---|---|
| **💬 OOC 보내기** (Ctrl+Enter) | 칸의 글을 OOC로 |
| **입력창에 넣기** | 입력창에 넣기 |
| 💬 (메모 옆) | 그 메모 바로 보내기 |
| 📌 | 위에 고정 |
| ⋯ (📝 탭) | OOC로 보내기 · 입력창에 넣기 · 🌟 페이지 만들기 · QR로 만들기(`/ooc 글` QR) · 복사 |

| 설정 (📝 탭) | 내용 |
|---|---|
| 보내는 방식 | **결과물 받기**(AI가 요청대로 쓴 글을 캐릭터 메시지로, 실리태번 `/gen` → `/sendas`) · **전개에 반영하기**(다음 답에, 마리나라 `/guided`) · **직접 보내기**(내 메시지로) · **입력창에 넣기** |
| 감싸개 | OOC에 씌우는 틀 |
| 📝 버블 | 표시·아이콘 |
| 글을 긁으면 📝 버튼 | 켜기·끄기 |
| 백업 | `.memo.json` |

- 꺼내 쓰기: 🍰 메뉴의 📝 · 빈칸 창의 📝 · `[[메모]]` · QR의 `/memo`(예: `/memo | /sys <system>{{pipe}}</system>`)
- 마리나라 확장 저장 공간에 저장 → 다른 기기에서도 보임

## 메시지 번호 기준

마리나라는 첫 메시지 **1번**, 실리태번은 **0번**. 실리태번 QR은 **가져올 때 한 번** 마리나라 기준으로 고쳐 저장, **내보낼 때** 되돌림.

- 숫자 번호는 +1: `/hide 0` → `/hide 1`, `/messages 0-5` → `/messages 1-6`, `at=0` → `at=1`
- `{{lastMessageId}}` 기준 번호는 그대로(변수에 담아 더하고 빼도 같음)
- `{{lastMessageId}}`와 **비교하는 숫자**는 +1: `right=5` → `right=6`
- 메시지 번호용 변수에 넣은 숫자도 +1: `/setvar key=s 0` → `key=s 1`
- 뜻이 다른 명령은 실리태번 뜻대로: `/nar` → `/sys`, `/random` → `/randomchar`
- 바꿀 수 없는 경우(입력받은 값으로 메시지 고르기, 번호를 글자로 출력)만 **실리태번 기준**으로 두고 편집 화면에 이유 표시

## 변수

- `/setvar` → 되도록 **마리나라 채팅 변수**(프롬프트·로어북의 `{{getvar::이름}}`에서도 보임)
- 마리나라 규칙(이름은 영문·숫자·`_` 64자 이내, 값 10,000자 이내) 밖의 변수는 Dispensa 저장소에. QR 안 동작은 같음
- `/setglobalvar`(전역 변수)는 Dispensa 저장소

## 지원하는 명령

실리태번에도 있는 명령:

| 분류 | 명령 |
|---|---|
| 흐름 | `/if` `/while` `/times` `/run` `/:` `/abort` `/break` `/return` `/pass` `/delay` `/let` `/var` |
| 변수 | `/setvar` `/getvar` `/addvar` `/incvar` `/decvar` `/flushvar` `/setglobalvar` `/getglobalvar` `/addglobalvar` `/incglobalvar` `/decglobalvar` `/flushglobalvar` `/listvar` |
| 계산 | `/add` `/sub` `/mul` `/div` `/mod` `/pow` `/max` `/min` `/sin` `/cos` `/log` `/abs` `/sqrt` `/round` `/rand` `/len` `/fuzzy` |
| 글자·데이터 | `/replace` `/upper` `/lower` `/substr` `/match` `/test` `/sort` `/array-wrap` `/array-unwrap` `/trimstart` `/trimend` |
| 대화창 | `/echo` `/popup` `/input` `/buttons` `/setinput` `/beep` `/loader-show` `/loader-hide` `/loader-wrap` `/clipboard-set` `/clipboard-get` `/is-mobile` |
| AI 생성 | `/gen` `/genraw` `/ask` `/trigger` `/continue` `/regenerate` `/addswipe` |
| 메시지 | `/sendas` `/send` `/sys` `/comment` `/messages` `/hide` `/unhide` `/cut`(확인 후) `/del`(확인 후) |
| 캐릭터 | `/randomchar [태그]` (실리태번의 `/random`. 무작위 캐릭터의 최근 채팅을 열거나 새로 만들고 이름 반환) · `/char-get` `/char-update`(확인 후) |
| 로어북 | `/getchatbook` `/findentry` `/getentryfield` `/setentryfield` `/createentry` (실리태번 World Info 필드 이름 `key` `keysecondary` `comment` `content` `disable` `order` `depth` … 그대로 사용) |
| 채팅 | `/getchatname` `/renamechat` `/newchat` `/note`(작가 노트) `/depth`(작가 노트 깊이) |
| QR | `/qr` `/qr-set` `/qr-set-on` `/qr-set-off`(모든 채팅) `/qr-chat-set` `/qr-chat-set-on` `/qr-chat-set-off`(이 채팅) `/qr-set-list [all\|global\|chat]` `/qr-list` `/qr-get` `/qr-create` `/qr-update` `/qr-delete`(확인 후) `/qr-contextadd` `/qr-contextdel` `/qr-contextclear`(하위 메뉴) `/qr-set-create` `/qr-set-update` `/qr-set-delete`(확인 후) `/qr-arg` `/import` `/breakpoint` |

마리나라 명령: `/guided` `/nar` `/as` `/impersonate` `/illustrate` `/selfie` `/video` `/emote` `/roll` `/remind` `/scene` `/status` `/goto` `/random` `/impersonate_prompt`

Dispensa 전용 명령(실리태번에 없음):

| 분류 | 명령 |
|---|---|
| 트래커 | `/tracker-get 경로` `/tracker-set [stat=on] [max=100] [color=#f66] 경로 값` `/tracker-add 경로 숫자` `/agents-retry [에이전트…]` |
| 로어북 | `/lore-books`(이 채팅에 켜진 로어북) `/lore-list [file=책]`(항목 목록) |
| 페르소나·연결 | `/persona-get [field=]` `/connection [이름]`(지금 연결 보기·바꾸기) `/connections` `/peek-prompt`(AI가 받을 프롬프트 보기) `/reload-page` |
| 글자·데이터 | `/trim` `/split` `/join` `/json-get` `/json-set` `/json-keys` `/randompick` `/date` `/count` `/isempty` |
| 입력·화면 | `/form`(여러 칸 입력) `/pick`(목록에서 고르기) `/confirm` `/notify` `/wait-reply`(AI 답변 기다리기) |
| Dock | `/dock show\|hide\|toggle` `/dock-layout mode=folder\|row` `/qr-later`(정해 둔 시간 뒤에 QR 실행) |
| 비주얼라이저 | `/visz [output=viewer\|chat] 주제`(`[[…]]`는 먼저 물어봄) |
| 메모장 | `/memo [찾을 말]`(메모 골라서 그 글을 돌려줌) `/memo-add 글` `/memo-list` `/ooc 글`(메모장 방식으로 OOC 보내기) |

QR 명령은 실리태번과 같은 인자. `/qr-create`·`/qr-update`의 `icon=`(이모지, 또는 `fa-dice` 같은 Font Awesome 이름은 비슷한 이모지로), `showlabel=`, `startup=` `user=` `bot=` `load=` `new=` `group=` `generation=`(자동 실행), `label=` 대신 `id=`(세트 안 순서, 1부터)도 가능. `/qr-arg 이름 값`: `{{arg::이름}}`의 기본값(`/run 이름=값 QR`로 넘긴 값이 우선). `/import from=세트.QR 클로저 [클로저 as 새이름]`: 다른 QR이 `/let`으로 둔 클로저 가져오기.

트래커 경로 = 마리나라 트래커 패널의 칸:

| 경로 | 뜻 |
|---|---|
| `date` `time` `location` `weather` `temperature` | 날짜·시간·장소·날씨·기온 |
| `world.이름` | 세계 칸 |
| `custom.이름` | 커스텀 트래커 칸 |
| `persona.이름` / `persona.이름.max` | 내 페르소나 수치와 최대값 |
| `char.캐릭터.mood` (`appearance` `outfit` `thoughts` `emoji` `action`) | 캐릭터 상태 |
| `char.캐릭터.이름` / `char.캐릭터.이름.max` | 캐릭터 수치(없으면 캐릭터 커스텀 칸). 새로 만들 때 `stat=on`이면 막대 수치 |
| `status` | 내 상태 문구 |
| `inventory` `quests` `events` `characters` | 읽기만 가능(JSON) |

예: `/tracker-add char.엘리.호감도 5 | /tracker-get char.엘리.호감도 | /echo 호감도: {{pipe}}`

문법은 실리태번과 같음: 파이프 `|`, 파이프 끊기 `||`, 클로저 `{: … :}`와 즉시 실행 `{: … :}()`, 클로저 인자, `//` `/#` `/* … *|` 주석, 이스케이프, `/parser-flag STRICT_ESCAPING` / `REPLACE_GETVAR`.

지원하지 않는 명령이 든 QR은 가져올 때 ⚠ 표시.

## 알아 둘 점

- `/gen`: 저장하지 않는 생성(dry run), 채팅 맥락 + 지시문. `/genraw`: 지시문만
- `/nar` = 마리나라 `/guided`, `/random` = 마리나라 "돌발 이벤트". 실리태번에서 가져온 것은 `/sys`, `/randomchar`로
- 실리태번 확장의 매크로(예: `{{charkey}}`)는 그대로 남음
- 트래커 패널 화면은 다음 답변이나 채팅을 다시 열 때 갱신(바로 보려면 `/reload-page`)
- 실리태번 아이콘(Font Awesome) ↔ 비슷한 이모지로 변환
- "이 채팅"·"이 캐릭터" 설정은 Dispensa 저장 공간에(채팅을 옮기면 따라가지 않음)
- `/echo 이름=값`처럼 `단어=`로 시작하면 인자로 읽힘(실리태번과 같음) → `/echo 이름: 값`
- 채팅 속 HTML 페이지의 스크립트 실행: [Fornello](https://github.com/FigCake/ME.Fornello)


## 라이선스와 출처

- Dispensa: [GNU AGPL-3.0](LICENSE). Copyright (C) 2026 FigCake
- STscript 해석기는 [SillyTavern](https://github.com/SillyTavern/SillyTavern)(AGPL-3.0)의 소스와 동작을, 마리나라 연동은 [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)(AGPL-3.0)의 API와 동작을 따름. 두 프로젝트의 파생물로 보고 같은 라이선스 사용
- 전체 소스: 배포 저장소의 `ME-Dispensa-<버전>-source.zip`. 고쳐서 배포하거나 서비스로 제공하면 고친 소스도 AGPL-3.0으로 공개
- 🌟 슈퍼비즈 비주얼라이저 문구(`src/visz/superviz.ts`의 글): Copyright (C) 2026 FigCake, 코드와 별도로 [CC BY-NC-SA 4.0](LICENSE-SUPERVIZ.txt). 출처 표시 시 공유·수정 가능, 상업적 이용 불가, 수정본도 같은 조건. 코드가 아니라 AI에게 보내는 글. 기본 QR과 다른 예시를 포함한 나머지는 모두 AGPL-3.0
- 아이콘: [Lucide](https://lucide.dev)(ISC). 이미지 저장: [html-to-image](https://github.com/bubkoo/html-to-image)(MIT). 라이선스 전문은 `THIRD_PARTY_NOTICES.txt`와 `extension.js` 끝에
