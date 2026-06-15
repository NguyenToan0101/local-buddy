FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- ĐOẠN QUAN TRỌNG ---
# Khai báo ARG để nhận biến từ GitHub Actions truyền xuống
ARG VITE_API_URL
ARG VITE_PAYPAL_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID

COPY . .
RUN npm run build

# Stage deploy với Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
