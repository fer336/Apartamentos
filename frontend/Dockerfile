# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ARG VITE_OAUTH_PROD_URL

# Set Env Vars during build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_OAUTH_PROD_URL=$VITE_OAUTH_PROD_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

