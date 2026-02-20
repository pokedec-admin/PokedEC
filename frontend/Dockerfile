# Stage 1: Build the Angular application
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production
# Normalize output directory: if 'browser' folder exists, move contents up
RUN if [ -d "dist/frontend/browser" ]; then \
    cp -r dist/frontend/browser/* dist/frontend/ && \
    rm -rf dist/frontend/browser; \
    fi

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/frontend /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
