# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run production build
RUN npm run build

# Stage 2: Serve the production build with Nginx
FROM nginx:alpine

# Copy built files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to access the web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
