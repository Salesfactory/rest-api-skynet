FROM node:18

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY dist/ ./dist/

EXPOSE 5000
CMD ["node","dist/main.js"]