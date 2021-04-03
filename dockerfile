FROM node:14.16.0-alpine

RUN apk add --no-cache yarn youtube-dl ffmpeg

WORKDIR /app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn

COPY ./src ./src
COPY ./config ./config
COPY ./tsconfig.json ./tsconfig.json
RUN yarn build

ENV NODE_ENV=production
CMD cp /app/config.json /app/config/production.json 2>/dev/null \
  && node /app/build/index.js \
  || echo 'Missing File (config.json) - See README For More Information'