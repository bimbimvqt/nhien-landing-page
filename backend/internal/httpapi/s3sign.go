package httpapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"
)

// signS3Request adds AWS Signature Version 4 to an HTTP PUT request for S3/MinIO.
func signS3Request(req *http.Request, body []byte, bucket, key, region, accessKey, secretKey string) {
	now := time.Now().UTC()
	dateStamp := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")

	// Payload hash
	hash := sha256.Sum256(body)
	payloadHash := hex.EncodeToString(hash[:])

	// Set required headers before signing
	req.Header.Set("x-amz-date", amzDate)
	req.Header.Set("x-amz-content-sha256", payloadHash)
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/octet-stream")
	}

	// Canonical headers (sorted)
	headersToSign := []string{"content-type", "host", "x-amz-content-sha256", "x-amz-date"}
	sort.Strings(headersToSign)

	canonicalHeaders := ""
	for _, h := range headersToSign {
		var val string
		switch h {
		case "host":
			val = req.URL.Host
		default:
			val = req.Header.Get(http.CanonicalHeaderKey(h))
		}
		canonicalHeaders += fmt.Sprintf("%s:%s\n", h, strings.TrimSpace(val))
	}
	signedHeaders := strings.Join(headersToSign, ";")

	// Canonical request
	canonicalURI := req.URL.Path
	canonicalQueryString := req.URL.RawQuery
	canonicalRequest := strings.Join([]string{
		req.Method,
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	// String to sign
	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, region)
	hashCR := sha256.Sum256([]byte(canonicalRequest))
	stringToSign := strings.Join([]string{
		algorithm,
		amzDate,
		credentialScope,
		hex.EncodeToString(hashCR[:]),
	}, "\n")

	// Signing key
	signingKey := deriveSigningKey(secretKey, dateStamp, region, "s3")

	// Signature
	mac := hmac.New(sha256.New, signingKey)
	mac.Write([]byte(stringToSign))
	signature := hex.EncodeToString(mac.Sum(nil))

	// Authorization header
	authHeader := fmt.Sprintf(
		"%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm, accessKey, credentialScope, signedHeaders, signature,
	)
	req.Header.Set("Authorization", authHeader)
	_ = bytes.NewBuffer(body) // ensure body isn't consumed
}

func deriveSigningKey(secretKey, dateStamp, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	return kSigning
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
