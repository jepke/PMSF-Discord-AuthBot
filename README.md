# PMSF ALT Discord AuthBot

Great thanks to Chuckleslove for writing this bot.

This piece of work is only intended to work with https://github.com/whitewillem/PMSF

## Getting Started

```
npm install discord.js
npm install mysql

Create the users table with the SQL files in PMSF.

Update the config.json file so the bot works with your DB and discord bot token.

Run the bot with "node DiscordListener.js ./config.json".

This script will 
1) Sets all access_level to 0
2) Checks all guilds/roles in the config file and set users to that value on startup, also performs this check based on the timer variable in case it missed something
3) Monitors guild members for adding or losing roles and updating as needed
4) Monitors for guild leave/kick/ban and adjust access_level as needed



¯\_(ツ)_/¯
```

You can add the bot to pm2's ecosystem like this:
```
{
  name: 'AuthBot',
  script: 'DiscordListener.js',
  cwd: '/PMSF-Discord-AuthBot/',
  args: './config.json',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  out_file: 'NULL'
}
```
