# Build the static app with the exact dependency versions in the lockfile.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Monaco's TypeScript worker exceeds Node's automatic heap budget on small CI hosts.
# Keep this build-only; the final Nginx image does not run Node.
ARG NODE_BUILD_HEAP_MB=1536
RUN npm test && NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_HEAP_MB}" npm run build

# Only compiled assets and the web server are needed at runtime.
FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
