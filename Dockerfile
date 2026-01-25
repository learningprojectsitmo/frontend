# Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Copy source code
COPY . .

# Install dependencies
RUN npm install
# Build the application for production
RUN npm run build

# Install serve to run the built application
RUN npm install -g serve

# Expose port
EXPOSE 80

# Start the production server
CMD ["serve", "-s", "dist", "-l", "80"]