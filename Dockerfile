FROM node:20 AS base

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn build

EXPOSE 4567

CMD ["yarn", "start"]
