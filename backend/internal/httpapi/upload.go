package httpapi

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strings"
)

// uploadFile proxies file uploads to S3/MinIO using the internal endpoint.
// Go backend has Docker internal network access to MinIO (host-minio:9000),
// whereas Next.js running locally cannot reach it.
func (s *Server) uploadFile(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	if err := r.ParseMultipartForm(20 << 20); err != nil { // 20MB limit
		writeError(w, http.StatusBadRequest, "request too large or not multipart")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	folder := strings.TrimSpace(r.FormValue("folder"))
	bucketName := r.FormValue("bucket")
	if bucketName == "" {
		bucketName = getEnv("CDN_S3_BUCKET", "nhien-coffee")
	}

	// Build a safe, ASCII-only file name
	ext := strings.ToLower(path.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	baseName := safeFileName(strings.TrimSuffix(header.Filename, path.Ext(header.Filename)))
	if baseName == "" {
		baseName = "upload"
	}

	uniqueID, err := randomHex(8)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate id")
		return
	}

	var filePath string
	if folder != "" {
		filePath = fmt.Sprintf("%s/%s-%s%s", folder, uniqueID, baseName, ext)
	} else {
		filePath = fmt.Sprintf("%s-%s%s", uniqueID, baseName, ext)
	}

	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read file")
		return
	}

	// Use CDN endpoint
	s3Endpoint := getEnv("CDN_S3_ENDPOINT", "http://localhost:9000")
	s3Endpoint = strings.TrimRight(s3Endpoint, "/")
	uploadURL := fmt.Sprintf("%s/%s/%s", s3Endpoint, bucketName, filePath)

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPut, uploadURL, bytes.NewReader(data))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to build upload request")
		return
	}
	req.Header.Set("Content-Type", contentType)
	req.ContentLength = int64(len(data))

	accessKey := os.Getenv("CDN_S3_ACCESS_KEY")
	secretKey := os.Getenv("CDN_S3_SECRET_KEY")
	region := getEnv("CDN_S3_REGION", "us-east-1")
	if accessKey != "" && secretKey != "" {
		signS3Request(req, data, bucketName, filePath, region, accessKey, secretKey)
	}

	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		writeError(w, http.StatusBadGateway, fmt.Sprintf("upload to storage failed: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		writeError(w, http.StatusBadGateway, fmt.Sprintf("storage returned %d: %s", resp.StatusCode, string(body)))
		return
	}

	baseURL := getEnv("CDN_PUBLIC_BASE_URL", "https://cdn.skytruong.com")
	baseURL = strings.TrimRight(baseURL, "/")
	publicURL := fmt.Sprintf("%s/%s/%s", baseURL, bucketName, filePath)

	writeJSON(w, http.StatusOK, map[string]string{
		"url":  publicURL,
		"path": filePath,
	})
}

// getEnv reads an env var with a fallback default.
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// safeFileName strips non-ASCII and special chars, returns a URL-safe slug.
func safeFileName(s string) string {
	var b strings.Builder
	prevDash := false
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			prevDash = false
		} else if !prevDash {
			b.WriteByte('-')
			prevDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
