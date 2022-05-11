FROM node:14

WORKDIR /app
COPY package.json .

RUN npm install
COPY . ./

RUN npm run build

EXPOSE 2111
ENV PORT 2111
ENTRYPOINT ["npm","run","start"]