# 내 사진 넣는 곳 (local 모드)

`render-pin.js ... local` 이 여기서 사진을 읽어. **파일명 = 슬라이드 순서**.

## 이번 먹킷리스트(decks/foodtour-local.json) 사진 매핑
네가 보낸 사진을 아래 이름으로 이 폴더에 저장해줘 (확장자 jpg/png/webp 다 됨):

| 파일명 | 들어갈 사진 |
|---|---|
| `00.jpg` | **표지** — PATATA 젤라토 (손에 든 컵, 공원 배경) |
| `01.jpg` | 참치김밥 & 닭강정 도시락 |
| `02.jpg` | 탄탄면 (탄탄면공방, 반숙 계란) |
| `03.jpg` | 칼조네 & 부라타/토마토 샐러드 |
| `04.jpg` | 대파 크림치즈빵 |
| `05.jpg` | 베리 까눌레 (분홍 모찌 토핑) |

표지를 다른 사진으로 하고 싶으면 그 사진을 `00.jpg` 로 저장하면 돼.
(`00.jpg` 없으면 자동으로 `01.jpg` 를 표지에 씀)

## 실행
```
node render-pin.js concepts/dessert.json decks/foodtour-local.json local
```
→ `out/dessert/pin-local/slide_1~7.png`

권장: 가능하면 세로/정사각 1080px↑. 사진이 카드 전체에 꽉 차게 들어가.
