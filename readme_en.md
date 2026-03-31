# 6TMT2 Streaming Overlay

[中文版本](./readme.md)

This is the streaming overlay for 6TMT2. The goal is to keep it fully free and open source for all players who love osu!.

## For Streamers

### How to use
1. Download [tosu](https://github.com/tosuapp/tosu).
2. Download this repository into `tosu/static`, then launch tosu.
3. Open your browser and go to `http://127.0.0.1:24050/6TMT2/{page}/` to preview the overlay (`{page}` can be replaced with the page you want). After confirming it works, you can close the browser.
4. Capture the webpage in OBS (or similar software) and set up your data source.

### Required data files

| Filename | Description | When to replace |
| -------- | ----------- | --------------- |
| players.json | Stores all player information | Usually no need to replace, unless a player requests a display name change |
| beatmaps.json | Stores mappool information | When changing rounds |
| schedule.json | Match schedule and matchups (for intro scene) | When changing rounds |

These files must be placed in `_data/`. Example files are available in that folder.

### Scene list
This overlay is designed for **1v1** matches and includes the six scenes below:

| Scene | Content |
| ----- | ------- |
| intro | Pre-match countdown with both player IDs, seeds, and avatars |
| mappool | Mappool in the center, with both players' bans/picks at bottom-right |
| banpick | Both players' bans/picks in the center, with mappool at bottom-right |
| gameplay | In-game scene with both players' scores and song progress bar |
| winner | Winner display and final scoreline |
| showcase | Scene for mappool showcase |

### Resolution settings
1. All scenes are 1920x1080px (16:9).
2. In the gameplay scene, each player's tourney client window should be 960x720px (4:3).
3. In the showcase scene, gameplay resolution is 1440x810px (16:9), and can be scaled in OBS.

### Ban/Pick and Mappool controls
- `Ctrl + Left/Right click`: Blue/Red side ban map
- `Alt + Left/Right click`: Blue/Red side protect map
- `Left/Right click`: Blue/Red side pick map
- `Shift + click`: Clear all states for that map

### Seed reveal scene
| Scene | Content |
| ----- | ------- |
| seeding | Seed ranking and qualifiers scores |

Before using this scene, prepare `quals.json` and place it in `_data/`. Please refer to the sample file in that folder for the format.

## For Developers

A websocket test server is provided in `./debug`.
This server is written in Node.js. Before running it, install Node.js and run `npm install` to install dependencies.
After starting the server with `node ./debug/server.js`, change the websocket endpoint in `./_data/deps/connection.js` to `ws://127.0.0.1:3000/ws`.
Then you can test and debug without launching osu! itself or the tourney client.

TBD

## Acknowledgements

- Special thanks to [shdewz](https://github.com/shdewz) for open-sourcing [6wc-stream-overlay](https://github.com/shdewz/6wc-stream-overlay). The overall architecture and part of this project's code were developed based on that project.

- Thanks to [eric44168](https://osu.ppy.sh/users/4489605) for layout design support and technical help on some scenes.

- Thanks to 6TMT organizer [NickTerty](https://osu.ppy.sh/users/17847990) for giving me the opportunity to create this streaming overlay.

- Thanks to [luke920118](https://osu.ppy.sh/users/33689349). Even though he did nothing, this project would never have been completed without him.
