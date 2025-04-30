# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# If using config files or static assets, also copy them here
# COPY --from=builder /app/config ./config

EXPOSE 3000
CMD ["node", "dist/main"]