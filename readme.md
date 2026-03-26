# 6TMT2 Streaming Overlay

這裡是6TMT2的直播畫面，目標是完全免費開源給所有熱愛osu!這款遊戲的玩家使用。

### 此程式正在開發中，預計2026/4前完工上線。

### This program is under development, please check this out around April 2026

usage: clone this repo under tosu/static/ and run tosu

## For Streamers

### 使用方法：
1. 下載 [tosu](https://github.com/tosuapp/tosu)
2. 把這個repo下載到tosu/static底下，並且開啟tosu
3. 開啟瀏覽器 http://127.0.0.1:24050/6TMT2/{page}/ 即可看到直播畫面 ({page}的部分可替換成你想要看的頁面)，確認畫面正常後可以關閉瀏覽器
4. 使用OBS等軟體擷取網頁，並且設定好資料來源

### 需要準備的資料

| 檔案名稱 | 說明 | 替換時機 |
| -------- | -------- | -------- |
| players.json   | 記錄所有玩家的資訊 | 通常不須替換，除非玩家要求更改顯示名稱 |
| beatmaps.json  | 記錄圖池資訊 | 更換輪次時 |
| schedule.json | 比賽的時程與對戰組合(intro用) | 更換輪次時 |

上述檔案必須放在 _data/ 底下，且在該資料夾內可以找到這些檔案的範例。

### 畫面列表
本直播介面是專為**1v1**比賽設計，共包含以下六個畫面：

| 畫面名稱 | 畫面內容 |
| -------- | -------- |
| intro    | 賽前倒數計時 & 顯示雙方id、種子序與頭貼 |
| mappool  | 中央顯示圖池，右下角顯示雙方的bp |
| banpick  | 中央顯示雙方的bp，右下角顯示圖池 |
| gameplay | 遊戲畫面，顯示雙方分數以及歌曲進度條 |
| winner   | 顯示勝利玩家與雙方比數 |
| showcase | 圖池展示用畫面 |

### 解析度設定
1. 所有畫面的解析度皆為1920×1080px (16:9)。
2. gameplay畫面中，雙方玩家的遊戲畫面(tourney client)需設定為960×720px (4:3)。
3. showcase畫面中，遊戲畫面的解析度為1440×810px (16:9)，可以用obs縮放畫面。

### bp畫面/圖池畫面使用方法
ctrl+左/右鍵：藍/紅方ban圖
alt+左/右鍵：藍/紅方保圖
普通左/右鍵：藍/紅方選圖
shift+滑鼠點擊：取消該圖譜所有狀態

### seed reveal畫面使用方法
| 畫面名稱 | 畫面內容 |
| -------- | -------- |
| seeding  | 顯示種子排名與預選賽玩家分數 |

使用此畫面前，請先準備好 quals.json 檔案，並放置於 _data/ 底下。格式請參考該資料夾內的範例檔案。

## For Developers 

./debug 目錄底下有提供測試用的 websocket server。
這個 server 是用 node.js 寫的，執行之前要先安裝 node.js，並且用 `npm install` 安裝 `node_modules`。
使用 `node ./debug/server.js` 啟動 server 後，到 `./_data/deps/connection.js` 將連線改成 `ws://127.0.0.1:3000/ws`，即可在不開啟 osu! 本體或 tourney client 的情況下進行測試與除錯。

TBD

## Acknowledgements

- 特別感謝 [shdewz](https://github.com/shdewz) 開放提供 [6wc-stream-overlay](https://github.com/shdewz/6wc-stream-overlay) 的原始碼，基本上此專案的架構與部分程式碼都是參考自該專案進行開發。

- 感謝 [eric44168](https://osu.ppy.sh/users/4489605) 提供部分畫面的排版設計與技術支援。

- 感謝6TMT主辦 [NickTerty](https://osu.ppy.sh/users/17847990) 提供我機會製作這個直播畫面。

- 感謝 [luke920118](https://osu.ppy.sh/users/33689349)，雖然他啥事都沒做，但沒有他這個專案就永遠無法完成。
