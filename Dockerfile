# Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Use npm install instead of npm ci to handle version mismatches
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 80

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]