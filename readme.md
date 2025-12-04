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
| players.json   | 記錄所有玩家的資訊 | 不需替換 |
| beatmaps.json  | 記錄圖池資訊 | 更換圖池時替換 |
| coming_up.json | 記錄單場比賽的資訊(intro用) | 逐場替換 |

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




所有畫面的解析度皆為1920×1080px，且雙方玩家的遊戲畫面需設定為960×720px。

### bp畫面/圖池畫面使用方法
ctrl+左/右鍵：藍/紅方ban圖
alt+左/右鍵：藍/紅方保圖
普通左/右鍵：藍/紅方選圖
shift+滑鼠點擊：取消該圖譜所有狀態

## For Developers 

TBD

