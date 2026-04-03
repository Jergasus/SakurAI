# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies (including devDependencies for Nest CLI)
RUN npm ci

COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
