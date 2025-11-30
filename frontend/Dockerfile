# FROM node:18-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["npm","start"]


# ============================
# 1) BUILD STAGE
# ============================
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy .env vào image (vì dockerignore cũ đã ignore nó)
COPY .env .env

# Copy toàn bộ source và build production
COPY . .
RUN npm run build


# ============================
# 2) NGINX RUN STAGE
# ============================
FROM nginx:alpine

# Copy bản build vào nginx
COPY --from=builder /app/build /usr/share/nginx/html
# Copy cấu hình nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80 cho nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
