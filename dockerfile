FROM node:14.4.0-alpine

RUN apk add  --no-cache yarn

WORKDIR /app
COPY . .

RUN yarn
CMD [ "yarn", "start" ]