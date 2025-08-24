# Use Node.js 18 Alpine image
FROM node:current-alpine

# Set working directory
WORKDIR /app

# Install netcat
RUN apk add --no-cache netcat-openbsd \
    && npm install -g npm@latest

# Set environment variables
ENV NODE_ENV=${ENVIRONMENT:-development} \
    NEXT_TELEMETRY_DISABLED=1

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the application
ENTRYPOINT ["./entrypoint.sh"]
