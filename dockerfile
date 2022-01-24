FROM node:16-alpine

RUN apk add --no-cache yarn ffmpeg python3 bash
RUN set -x && \
  wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/bin/yt-dlp && \
  chmod a+x /usr/bin/yt-dlp

WORKDIR /app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn

COPY ./src ./src
COPY ./config ./config
COPY ./tsconfig.json ./tsconfig.json
RUN yarn build

RUN touch availableToDownload

COPY ./downloadVideos.sh ./downloadVideos.sh
RUN chmod +x ./downloadVideos.sh


ENV NODE_ENV=production
CMD cp /app/config.json /app/config/production.json 2>/dev/null && \
  /usr/bin/yt-dlp -U && \
  /usr/bin/yt-dlp --version && \
  node /app/build/index.js || \
  echo 'Missing File (config.json) - See README For More Information'
