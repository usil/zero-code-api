FROM node:14

WORKDIR /app
COPY package.json .

RUN npm install
COPY . ./

RUN npm run build

EXPOSE 2110
ENV PORT 2110
ENTRYPOINT ["npm","run","start"]