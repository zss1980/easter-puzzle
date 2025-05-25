# ---- Build Stage ----
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
# Use npm ci for reproducible builds if package-lock.json is present
RUN npm ci

# Copy the rest of the frontend application code
COPY . .

# Build the application
# This typically creates a 'dist' or 'build' folder with static assets
RUN npm run build

# ---- Serve Stage ----
# Use Nginx to serve the static files
FROM nginx:1.25-alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration for SPA routing
# If you have a nginx.conf file in the same directory as this Dockerfile:
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# Otherwise, Nginx will use its default configuration which might not work well for SPAs directly.
# For SPAs, you often need a configuration like:
# server {
#   listen 80;
#   root /usr/share/nginx/html;
#   index index.html;
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
# }

# Expose port 80 for Nginx
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
