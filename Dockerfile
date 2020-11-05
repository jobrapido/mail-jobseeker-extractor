FROM node:12

WORKDIR /app

ADD package.json /app
ADD ./build/src /app

RUN npm install --production
