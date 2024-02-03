# build environment
FROM node:20-slim as react-build
ENV NODE_ENV production
ENV GENERATE_SOURCEMAP=false 
ENV REACT_APP_ROUTE_BASENAME='radioactivity-map' 
ENV REACT_APP_RADIOACTIVITY_API_URL='https://api-radioactivity-123456.web.app'

WORKDIR /app
COPY . ./
RUN yarn install --prod --frozen-lockfile && yarn cache clean
RUN yarn react-scripts build


# server environment
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/configfile.template

COPY --from=react-build /app/build /usr/share/nginx/html

ENV PORT 8080
ENV HOST 0.0.0.0
EXPOSE 8080
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
