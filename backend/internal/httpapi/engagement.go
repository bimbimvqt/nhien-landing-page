package httpapi

import (
	"net/http"
	"time"

	"github.com/google/uuid"
)

type EngagementData struct {
	Favorites           []Favorite           `json:"favorites"`
	PromotionClaims     []PromotionClaim     `json:"claims"`
	TaskCompletions     []string             `json:"completed_tasks"`
	LoyaltyAccount      *LoyaltyAccount      `json:"loyalty_account"`
	LoyaltyTransactions []LoyaltyTransaction `json:"loyalty_transactions"`
}

type Favorite struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	ProductID uuid.UUID  `json:"product_id"`
	CreatedAt time.Time  `json:"created_at"`
	Product   *Product   `json:"product,omitempty"`
}

type PromotionClaim struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	PromotionID   uuid.UUID  `json:"promotion_id"`
	CodeSnapshot  string     `json:"code_snapshot"`
	ClaimedAt     time.Time  `json:"claimed_at"`
	RedeemedCount int        `json:"redeemed_count"`
	RemainingUses int        `json:"remaining_uses"`
	RedeemedAt    *time.Time `json:"redeemed_at"`
	Promotion     *Promotion `json:"promotion,omitempty"`
}

type LoyaltyAccount struct {
	UserID    uuid.UUID `json:"user_id"`
	Points    int       `json:"points"`
	Stamps    int       `json:"stamps"`
	Tier      string    `json:"tier"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LoyaltyTransaction struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Points    int       `json:"points"`
	Stamps    int       `json:"stamps"`
	Note      *string   `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

func (s *Server) ensureUserExists(r *http.Request, userID uuid.UUID, email string) error {
	_, err := s.db.Exec(r.Context(), `
		insert into users (id, email)
		values ($1, $2)
		on conflict (id) do nothing
	`, userID, email)
	return err
}

func (s *Server) getUserEngagement(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}
	email := r.URL.Query().Get("email")
	_ = s.ensureUserExists(r, userID, email)

	var data EngagementData
	data.Favorites = []Favorite{}
	data.PromotionClaims = []PromotionClaim{}
	data.TaskCompletions = []string{}
	data.LoyaltyTransactions = []LoyaltyTransaction{}

	// Favorites
	favRows, err := s.db.Query(r.Context(), `
		select f.id, f.user_id, f.product_id, f.created_at, p.id, p.name, p.category, p.image_url
		from favorites f
		left join products p on f.product_id = p.id
		where f.user_id = $1
		order by f.created_at desc
	`, userID)
	if err == nil {
		for favRows.Next() {
			var f Favorite
			var p Product
			if err := favRows.Scan(&f.ID, &f.UserID, &f.ProductID, &f.CreatedAt, &p.ID, &p.Name, &p.Category, &p.ImageURL); err == nil {
				f.Product = &p
				data.Favorites = append(data.Favorites, f)
			}
		}
		favRows.Close()
	}

	// Promotion Claims
	claimRows, err := s.db.Query(r.Context(), `
		select c.id, c.user_id, c.promotion_id, c.code_snapshot, c.claimed_at, c.redeemed_count, c.remaining_uses, c.redeemed_at, p.id, p.name
		from promotion_claims c
		left join promotions p on c.promotion_id = p.id
		where c.user_id = $1
		order by c.claimed_at desc
	`, userID)
	if err == nil {
		for claimRows.Next() {
			var c PromotionClaim
			var p Promotion
			if err := claimRows.Scan(&c.ID, &c.UserID, &c.PromotionID, &c.CodeSnapshot, &c.ClaimedAt, &c.RedeemedCount, &c.RemainingUses, &c.RedeemedAt, &p.ID, &p.Name); err == nil {
				c.Promotion = &p
				data.PromotionClaims = append(data.PromotionClaims, c)
			}
		}
		claimRows.Close()
	}

	// Tasks
	taskRows, err := s.db.Query(r.Context(), `select task_key from user_task_completions where user_id = $1`, userID)
	if err == nil {
		for taskRows.Next() {
			var key string
			if err := taskRows.Scan(&key); err == nil {
				data.TaskCompletions = append(data.TaskCompletions, key)
			}
		}
		taskRows.Close()
	}

	// Loyalty Account
	var acc LoyaltyAccount
	err = s.db.QueryRow(r.Context(), `select user_id, points, stamps, tier, updated_at from loyalty_accounts where user_id = $1`, userID).Scan(&acc.UserID, &acc.Points, &acc.Stamps, &acc.Tier, &acc.UpdatedAt)
	if err == nil {
		data.LoyaltyAccount = &acc
	}

	// Loyalty Transactions
	txRows, err := s.db.Query(r.Context(), `select id, user_id, points, stamps, note, created_at from loyalty_transactions where user_id = $1 order by created_at desc limit 5`, userID)
	if err == nil {
		for txRows.Next() {
			var tx LoyaltyTransaction
			if err := txRows.Scan(&tx.ID, &tx.UserID, &tx.Points, &tx.Stamps, &tx.Note, &tx.CreatedAt); err == nil {
				data.LoyaltyTransactions = append(data.LoyaltyTransactions, tx)
			}
		}
		txRows.Close()
	}

	writeJSON(w, http.StatusOK, data)
}

func (s *Server) updateProfile(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var input struct {
		DisplayName string `json:"display_name"`
		Email       string `json:"email"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_ = s.ensureUserExists(r, userID, input.Email)

	_, _ = s.db.Exec(r.Context(), `
		insert into profiles (user_id, display_name, email) values ($1, $2, $3)
		on conflict (user_id) do update set display_name = $2, email = $3
	`, userID, input.DisplayName, input.Email)

	_, _ = s.db.Exec(r.Context(), `
		insert into loyalty_accounts (user_id) values ($1)
		on conflict (user_id) do nothing
	`, userID)

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) addFavorite(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var input struct {
		ProductID string `json:"product_id"`
		Email     string `json:"email"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	productID, err := uuid.Parse(input.ProductID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product_id")
		return
	}

	_ = s.ensureUserExists(r, userID, input.Email)

	var id uuid.UUID
	err = s.db.QueryRow(r.Context(), `
		insert into favorites (user_id, product_id) values ($1, $2)
		on conflict (user_id, product_id) do update set created_at = now()
		returning id
	`, userID, productID).Scan(&id)
	
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"id": id})
}

func (s *Server) removeFavorite(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	productID, ok2 := parseUUIDPath(r, "product_id")
	if !ok || !ok2 {
		writeError(w, http.StatusBadRequest, "invalid user_id or product_id")
		return
	}

	_, err := s.db.Exec(r.Context(), `delete from favorites where user_id = $1 and product_id = $2`, userID, productID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) claimPromotion(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var input struct {
		PromotionID string `json:"promotion_id"`
		Email       string `json:"email"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	promoID, err := uuid.Parse(input.PromotionID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid promotion_id")
		return
	}

	_ = s.ensureUserExists(r, userID, input.Email)

	var code string
	err = s.db.QueryRow(r.Context(), `select code from promotions where id = $1`, promoID).Scan(&code)
	if err != nil {
		writeError(w, http.StatusBadRequest, "promotion not found")
		return
	}

	_, err = s.db.Exec(r.Context(), `
		insert into promotion_claims (user_id, promotion_id, code_snapshot) values ($1, $2, $3)
		on conflict (user_id, promotion_id) do nothing
	`, userID, promoID, code)
	
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) completeTask(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var input struct {
		TaskKey string `json:"task_key"`
		Email   string `json:"email"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_ = s.ensureUserExists(r, userID, input.Email)

	_, err := s.db.Exec(r.Context(), `
		insert into user_task_completions (user_id, task_key) values ($1, $2)
		on conflict (user_id, task_key) do nothing
	`, userID, input.TaskKey)
	
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
