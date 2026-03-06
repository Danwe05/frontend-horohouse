# Development Dockerfile for Next.js
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Run in development mode with hot reload
CMD ["npm", "run", "dev"]