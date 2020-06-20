FROM node:14.4.0-alpine

RUN apk add  --no-cache yarn youtube-dl ffmpeg

WORKDIR /app
COPY ./src ./src
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock

RUN yarn
CMD [ "yarn", "start" ]