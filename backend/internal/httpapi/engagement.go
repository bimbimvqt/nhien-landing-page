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
	RedeemedBy    *uuid.UUID `json:"redeemed_by"`
	RedeemNote    *string    `json:"redeem_note"`
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

func (s *Server) redeemClaim(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	claimID, ok := parseUUIDPath(r, "claim_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid claim_id")
		return
	}

	var input struct {
		RedeemedBy string `json:"redeemed_by"`
		RedeemNote string `json:"redeem_note"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Fetch current claim to check remaining_uses
	var redeemedCount int
	var remainingUses int
	var promotionID uuid.UUID
	err := s.db.QueryRow(r.Context(), `
		select redeemed_count, remaining_uses, promotion_id
		from promotion_claims
		where id = $1
	`, claimID).Scan(&redeemedCount, &remainingUses, &promotionID)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "claim not found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	if remainingUses <= 0 {
		writeError(w, http.StatusConflict, "no remaining uses")
		return
	}

	now := time.Now()
	newCount := redeemedCount + 1
	newRemaining := remainingUses - 1

	var redeemedByPtr *uuid.UUID
	if input.RedeemedBy != "" {
		if id, err := uuid.Parse(input.RedeemedBy); err == nil {
			redeemedByPtr = &id
		}
	}

	var notePtr *string
	if input.RedeemNote != "" {
		notePtr = &input.RedeemNote
	}

	var claim PromotionClaim
	var promo Promotion
	err = s.db.QueryRow(r.Context(), `
		update promotion_claims
		set redeemed_at = $1,
		    redeemed_by = $2,
		    redeem_note = $3,
		    redeemed_count = $4,
		    remaining_uses = $5
		where id = $6 and remaining_uses > 0
		returning id, user_id, promotion_id, code_snapshot, claimed_at, redeemed_count, remaining_uses, redeemed_at
	`, now, redeemedByPtr, notePtr, newCount, newRemaining, claimID).Scan(
		&claim.ID, &claim.UserID, &claim.PromotionID, &claim.CodeSnapshot,
		&claim.ClaimedAt, &claim.RedeemedCount, &claim.RemainingUses, &claim.RedeemedAt,
	)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusConflict, "claim already fully redeemed or not found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	// Increment promotion usage_count
	_, _ = s.db.Exec(r.Context(), `
		update promotions set usage_count = usage_count + 1 where id = $1
	`, promotionID)

	// Load promotion info
	_ = s.db.QueryRow(r.Context(), `
		select id, name, code, discount, usage_count, max_redemptions_per_user, max_total_redemptions, end_date, active, created_at
		from promotions where id = $1
	`, claim.PromotionID).Scan(
		&promo.ID, &promo.Name, &promo.Code, &promo.Discount, &promo.UsageCount,
		&promo.MaxRedemptionsPerUser, &promo.MaxTotalRedemptions, &promo.EndDate, &promo.Active, &promo.CreatedAt,
	)
	claim.Promotion = &promo

	writeJSON(w, http.StatusOK, claim)
}

type ClaimWithProfile struct {
	PromotionClaim
	DisplayName *string `json:"display_name,omitempty"`
	Email       *string `json:"email,omitempty"`
}

func (s *Server) searchClaimsByCode(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "code is required")
		return
	}

	rows, err := s.db.Query(r.Context(), `
		select c.id, c.user_id, c.promotion_id, c.code_snapshot, c.claimed_at,
		       c.redeemed_count, c.remaining_uses, c.redeemed_at,
		       p.id, p.name, p.code, p.discount, p.usage_count, p.max_redemptions_per_user, p.max_total_redemptions, p.end_date, p.active, p.created_at,
		       pr.display_name, pr.email
		from promotion_claims c
		left join promotions p on c.promotion_id = p.id
		left join profiles pr on c.user_id = pr.user_id
		where upper(c.code_snapshot) = upper($1)
		order by c.claimed_at desc
		limit 30
	`, code)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var claims []ClaimWithProfile
	for rows.Next() {
		var c ClaimWithProfile
		var promo Promotion
		if err := rows.Scan(
			&c.ID, &c.UserID, &c.PromotionID, &c.CodeSnapshot, &c.ClaimedAt,
			&c.RedeemedCount, &c.RemainingUses, &c.RedeemedAt,
			&promo.ID, &promo.Name, &promo.Code, &promo.Discount, &promo.UsageCount,
			&promo.MaxRedemptionsPerUser, &promo.MaxTotalRedemptions, &promo.EndDate, &promo.Active, &promo.CreatedAt,
			&c.DisplayName, &c.Email,
		); err == nil {
			c.Promotion = &promo
			claims = append(claims, c)
		}
	}

	if claims == nil {
		claims = []ClaimWithProfile{}
	}

	writeJSON(w, http.StatusOK, claims)
}

// UserSummary is the full snapshot needed by the POS terminal
type UserSummary struct {
	UserID        uuid.UUID        `json:"user_id"`
	DisplayName   *string          `json:"display_name"`
	Email         string           `json:"email"`
	LoyaltyAccount *LoyaltyAccount `json:"loyalty_account"`
	ActiveClaims  []PromotionClaim `json:"active_claims"` // only remaining_uses > 0
	RecentTx      []LoyaltyTransaction `json:"recent_transactions"`
}

func (s *Server) getUserSummary(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var summary UserSummary
	summary.UserID = userID
	summary.ActiveClaims = []PromotionClaim{}
	summary.RecentTx = []LoyaltyTransaction{}

	// Profile
	_ = s.db.QueryRow(r.Context(), `
		select display_name, email from profiles where user_id = $1
	`, userID).Scan(&summary.DisplayName, &summary.Email)

	// Loyalty account
	var acc LoyaltyAccount
	err := s.db.QueryRow(r.Context(), `
		select user_id, points, stamps, tier, updated_at
		from loyalty_accounts where user_id = $1
	`, userID).Scan(&acc.UserID, &acc.Points, &acc.Stamps, &acc.Tier, &acc.UpdatedAt)
	if err == nil {
		summary.LoyaltyAccount = &acc
	}

	// Active promotion claims (remaining_uses > 0)
	claimRows, err := s.db.Query(r.Context(), `
		select c.id, c.user_id, c.promotion_id, c.code_snapshot, c.claimed_at,
		       c.redeemed_count, c.remaining_uses, c.redeemed_at,
		       p.id, p.name, p.code, p.discount, p.usage_count, p.max_redemptions_per_user,
		       p.max_total_redemptions, p.end_date, p.active, p.created_at
		from promotion_claims c
		left join promotions p on c.promotion_id = p.id
		where c.user_id = $1 and c.remaining_uses > 0
		  and p.active = true
		  and (p.end_date is null or p.end_date::date >= current_date)
		order by c.claimed_at desc
	`, userID)
	if err == nil {
		for claimRows.Next() {
			var c PromotionClaim
			var promo Promotion
			if err := claimRows.Scan(
				&c.ID, &c.UserID, &c.PromotionID, &c.CodeSnapshot, &c.ClaimedAt,
				&c.RedeemedCount, &c.RemainingUses, &c.RedeemedAt,
				&promo.ID, &promo.Name, &promo.Code, &promo.Discount, &promo.UsageCount,
				&promo.MaxRedemptionsPerUser, &promo.MaxTotalRedemptions, &promo.EndDate, &promo.Active, &promo.CreatedAt,
			); err == nil {
				c.Promotion = &promo
				summary.ActiveClaims = append(summary.ActiveClaims, c)
			}
		}
		claimRows.Close()
	}

	// Recent transactions (last 5)
	txRows, err := s.db.Query(r.Context(), `
		select id, user_id, points, stamps, note, created_at
		from loyalty_transactions where user_id = $1
		order by created_at desc limit 5
	`, userID)
	if err == nil {
		for txRows.Next() {
			var tx LoyaltyTransaction
			if err := txRows.Scan(&tx.ID, &tx.UserID, &tx.Points, &tx.Stamps, &tx.Note, &tx.CreatedAt); err == nil {
				summary.RecentTx = append(summary.RecentTx, tx)
			}
		}
		txRows.Close()
	}

	writeJSON(w, http.StatusOK, summary)
}

func calcTier(points, stamps int) string {
	score := points + stamps*10
	if score >= 500 {
		return "Gold"
	}
	if score >= 200 {
		return "Silver"
	}
	return "Member"
}

func (s *Server) updateLoyalty(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	userID, ok := parseUUIDPath(r, "user_id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid user_id")
		return
	}

	var input struct {
		Stamps int    `json:"stamps"`
		Points int    `json:"points"`
		Note   string `json:"note"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Ensure account exists
	_, _ = s.db.Exec(r.Context(), `
		insert into loyalty_accounts (user_id) values ($1) on conflict (user_id) do nothing
	`, userID)

	// Read current values
	var curPoints, curStamps int
	_ = s.db.QueryRow(r.Context(), `
		select points, stamps from loyalty_accounts where user_id = $1
	`, userID).Scan(&curPoints, &curStamps)

	nextPoints := max(0, curPoints+input.Points)
	nextStamps := max(0, curStamps+input.Stamps)
	nextTier := calcTier(nextPoints, nextStamps)

	// Update account
	var acc LoyaltyAccount
	err := s.db.QueryRow(r.Context(), `
		update loyalty_accounts
		set points = $1, stamps = $2, tier = $3, updated_at = now()
		where user_id = $4
		returning user_id, points, stamps, tier, updated_at
	`, nextPoints, nextStamps, nextTier, userID).Scan(
		&acc.UserID, &acc.Points, &acc.Stamps, &acc.Tier, &acc.UpdatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Record transaction
	note := input.Note
	if note == "" {
		note = "Tích điểm tại quán"
	}
	var tx LoyaltyTransaction
	_ = s.db.QueryRow(r.Context(), `
		insert into loyalty_transactions (user_id, points, stamps, note)
		values ($1, $2, $3, $4)
		returning id, user_id, points, stamps, note, created_at
	`, userID, input.Points, input.Stamps, note).Scan(
		&tx.ID, &tx.UserID, &tx.Points, &tx.Stamps, &tx.Note, &tx.CreatedAt,
	)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"loyalty_account": acc,
		"transaction":     tx,
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
