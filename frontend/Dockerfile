FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- ĐOẠN QUAN TRỌNG ---
# Khai báo ARG để nhận biến từ GitHub Actions truyền xuống
ARG VITE_API_URL
# Chuyển ARG thành ENV để Vite có thể đọc được lúc build
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Stage deploy với Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]