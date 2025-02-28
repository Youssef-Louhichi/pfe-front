FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Angular app
RUN npm run build --prod

# Stage 2: Serve app with Nginx
FROM nginx:alpine

# Copy built Angular files to Nginx
COPY --from=build /app/dist/pfe-front /usr/share/nginx/html