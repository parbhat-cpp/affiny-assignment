FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=development

RUN [ "$NODE_ENV" -eq "production" ] && npm run build || echo "Skipping build for $NODE_ENV"

EXPOSE 3000

CMD if [ "$NODE_ENV" -eq "production" ]; then \
        npm start; \
    else \
        npm run dev; \
    fi
