# FROM node

# WORKDIR /app

# COPY package.json .

# RUN npm install

# COPY . .
# EXPOSE 8080

# CMD ["npm" , "start"]

# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the port your app uses
EXPOSE 8081

# Run your application
CMD ["node", "server.js"]