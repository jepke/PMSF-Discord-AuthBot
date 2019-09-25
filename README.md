# PMSF ALT Discord AuthBot

Great thanks to Chuckleslove for writing this bot.

This piece of work is only intended to work with https://github.com/whitewillem/PMSF

## Getting Started

```
npm install discord.js
npm install mysql

Create the users table with the SQL files in PMSF.

This script will 
1) Sets all access_level to 0
2) Checks all guilds/roles in the config file and set users to that value on startup, also performs this check based on the timer variable in case it missed something
3) Monitors guild members for adding or losing roles and updating as needed
4) Monitors for guild leave/kick/ban and adjust access_level as needed



¯\_(ツ)_/¯
```
