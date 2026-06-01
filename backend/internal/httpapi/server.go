package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nhien-cafe/backend/internal/config"
)

type Server struct {
	db     *pgxpool.Pool
	cfg    config.Config
	logger *slog.Logger
}

type Product struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	Description  *string    `json:"description"`
	PriceS       *float64   `json:"price_s"`
	PriceM       *float64   `json:"price_m"`
	Category     string     `json:"category"`
	SubCategory  *string    `json:"sub_category"`
	ImageURL     *string    `json:"image_url"`
	IsBestSeller bool       `json:"is_best_seller"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Promotion struct {
	ID                    uuid.UUID `json:"id"`
	Name                  string    `json:"name"`
	Code                  string    `json:"code"`
	Discount              string    `json:"discount"`
	UsageCount            int       `json:"usage_count"`
	MaxRedemptionsPerUser int       `json:"max_redemptions_per_user"`
	MaxTotalRedemptions   *int      `json:"max_total_redemptions"`
	EndDate               *string   `json:"end_date"`
	Active                bool      `json:"active"`
	CreatedAt             time.Time `json:"created_at"`
}

type StoreSettings struct {
	ID            int             `json:"id"`
	BrandName     string          `json:"brand_name"`
	Hotline       string          `json:"hotline"`
	Address       string          `json:"address"`
	FacebookURL   *string         `json:"facebook_url"`
	InstagramURL  *string         `json:"instagram_url"`
	MapEmbedURL   *string         `json:"map_embed_url"`
	HeroImageURL  *string         `json:"hero_image_url"`
	OpeningHours  json.RawMessage `json:"opening_hours"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

func NewServer(db *pgxpool.Pool, cfg config.Config, logger *slog.Logger) *Server {
	return &Server{db: db, cfg: cfg, logger: logger}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /api/products", s.listProducts)
	mux.HandleFunc("POST /api/products", s.createProduct)
	mux.HandleFunc("PUT /api/products/{id}", s.updateProduct)
	mux.HandleFunc("DELETE /api/products/{id}", s.deleteProduct)
	mux.HandleFunc("GET /api/promotions", s.listPromotions)
	mux.HandleFunc("POST /api/promotions", s.createPromotion)
	mux.HandleFunc("PUT /api/promotions/{id}", s.updatePromotion)
	mux.HandleFunc("DELETE /api/promotions/{id}", s.deletePromotion)
	mux.HandleFunc("GET /api/store-settings", s.getStoreSettings)
	mux.HandleFunc("PUT /api/store-settings", s.updateStoreSettings)

	return s.withCORS(s.withLogging(mux))
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	if s.cfg.AdminAPIKey == "" {
		return true
	}

	if r.Header.Get("X-Admin-API-Key") == s.cfg.AdminAPIKey {
		return true
	}

	writeError(w, http.StatusUnauthorized, "invalid admin api key")
	return false
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := s.cfg.CORSOrigin
		if origin == "" {
			origin = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-API-Key")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		s.logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds())
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func parseLimit(r *http.Request, fallback int, max int) int {
	value := r.URL.Query().Get("limit")
	if value == "" {
		return fallback
	}

	limit, err := strconv.Atoi(value)
	if err != nil || limit <= 0 {
		return fallback
	}
	if limit > max {
		return max
	}
	return limit
}

func parseUUIDPath(r *http.Request, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue(name))
	return id, err == nil
}

func isNotFound(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}

func normalizeText(value string) string {
	return strings.TrimSpace(value)
}
