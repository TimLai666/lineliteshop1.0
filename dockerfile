FROM node:24-alpine AS frontend-builder

# 設置工作目錄
WORKDIR /app

COPY ./liff .

# 安裝依賴
RUN npm install

RUN npm run build

FROM golang:1.25-alpine AS backend-builder

WORKDIR /app

COPY . .

RUN go mod download

RUN go build -o main .

FROM alpine:latest

# 設置工作目錄
WORKDIR /app

# 從後端構建階段複製二進制文件
COPY --from=backend-builder /app/main .
# 從前端構建階段複製前端構建文件
COPY --from=frontend-builder /app/dist ./liff/dist

COPY .env .

CMD [ "./main" ]