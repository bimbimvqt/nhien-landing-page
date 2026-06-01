# syntax=docker/dockerfile:1

FROM golang:1.23-alpine AS builder
WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/nhien-api ./cmd/api

FROM alpine:3.20 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /out/nhien-api ./nhien-api
COPY migrations ./migrations

ENV API_ADDR=:8080 \
    MIGRATIONS_DIR=/app/migrations

EXPOSE 8080

CMD ["./nhien-api"]
