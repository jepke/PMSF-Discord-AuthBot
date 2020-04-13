# docker build -t auth-bot .
# docker run -v /abosulute/path/to/config/config.json:/usr/src/app auth-bot

FROM node
RUN npm install discord.js@11.6.2
RUN npm install ontime
RUN npm install mysql
RUN git clone https://github.com/pmsf/PMSF-Discord-AuthBot.git /usr/src/app/

WORKDIR /usr/src/app/
CMD ["node", "DiscordListener.js"]
