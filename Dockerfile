FROM node:12-alpine
RUN apk add --no-cache openssl
ADD . /mines
WORKDIR /mines
RUN npm install
CMD [ "npm", "start" ]
