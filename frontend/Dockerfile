<<<<<<< HEAD
# Build stage
FROM node:18-alpine AS build

=======
FROM node:18-alpine as build
>>>>>>> 5d2d191 (Fixed front-end and back-end connectivity)
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
<<<<<<< HEAD

=======
>>>>>>> 5d2d191 (Fixed front-end and back-end connectivity)
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]