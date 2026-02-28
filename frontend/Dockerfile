# Stage 1: Build the Angular application
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG API_URL=/api
RUN if [ -n "${SUPABASE_URL}" ]; then sed -i "s|supabaseUrl: '.*'|supabaseUrl: '${SUPABASE_URL}'|g" src/environments/environment.prod.ts; fi && \
    if [ -n "${SUPABASE_ANON_KEY}" ]; then sed -i "s|supabaseKey: '.*'|supabaseKey: '${SUPABASE_ANON_KEY}'|g" src/environments/environment.prod.ts; fi && \
    if [ -n "${API_URL}" ] && [ "${API_URL}" != "/api" ]; then sed -i "s|apiUrl: '.*'|apiUrl: '${API_URL}'|g" src/environments/environment.prod.ts; fi && \
    echo "=== environment.prod.ts after patch ===" && cat src/environments/environment.prod.ts

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
