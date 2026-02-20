FROM node:18-alpine

# Build argument to control SSH tools installation (DEV only)
ARG INSTALL_SSH_TOOLS=false

WORKDIR /app

COPY package*.json ./

# Install essential tools
RUN apk add --no-cache postgresql-client

RUN npm install

# Conditionally install SSH tools for DEV environment only
# This allows deployment buttons to work from the UI
RUN if [ "$INSTALL_SSH_TOOLS" = "true" ]; then \
    apk add --no-cache openssh-client rsync; \
    echo "✅ SSH tools installed (DEV environment)"; \
    else \
    echo "⚠️  SSH tools NOT installed (Production security)"; \
    fi

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
