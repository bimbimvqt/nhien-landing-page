package httpapi

import (
	"net/http"

	"github.com/google/uuid"
)

func (s *Server) listPromotions(w http.ResponseWriter, r *http.Request) {
	limit := parseLimit(r, 100, 500)
	activeOnly := r.URL.Query().Get("active") == "true"

	rows, err := s.db.Query(r.Context(), `
		select id, name, code, discount, usage_count, max_redemptions_per_user, max_total_redemptions, end_date, active, created_at
		from promotions
		where ($1::boolean = false or active = true)
		order by created_at desc
		limit $2
	`, activeOnly, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	promotions := []Promotion{}
	for rows.Next() {
		var promotion Promotion
		if err := rows.Scan(
			&promotion.ID,
			&promotion.Name,
			&promotion.Code,
			&promotion.Discount,
			&promotion.UsageCount,
			&promotion.MaxRedemptionsPerUser,
			&promotion.MaxTotalRedemptions,
			&promotion.EndDate,
			&promotion.Active,
			&promotion.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		promotions = append(promotions, promotion)
	}

	if rows.Err() != nil {
		writeError(w, http.StatusInternalServerError, rows.Err().Error())
		return
	}

	writeJSON(w, http.StatusOK, promotions)
}

func (s *Server) createPromotion(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	var input Promotion
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	promotion, err := s.savePromotion(r, uuid.Nil, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, promotion)
}

func (s *Server) updatePromotion(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	id, ok := parseUUIDPath(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid promotion id")
		return
	}

	var input Promotion
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	promotion, err := s.savePromotion(r, id, input)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "promotion not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, promotion)
}

func (s *Server) deletePromotion(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	id, ok := parseUUIDPath(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid promotion id")
		return
	}

	tag, err := s.db.Exec(r.Context(), `delete from promotions where id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "promotion not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) savePromotion(r *http.Request, id uuid.UUID, input Promotion) (Promotion, error) {
	input.Name = normalizeText(input.Name)
	input.Code = normalizeText(input.Code)
	input.Discount = normalizeText(input.Discount)
	if input.Name == "" || input.Code == "" || input.Discount == "" {
		return Promotion{}, errValidation("name, code and discount are required")
	}
	if input.MaxRedemptionsPerUser <= 0 {
		input.MaxRedemptionsPerUser = 1
	}

	var promotion Promotion
	var err error
	if id == uuid.Nil {
		err = s.db.QueryRow(r.Context(), `
			insert into promotions (name, code, discount, usage_count, max_redemptions_per_user, max_total_redemptions, end_date, active)
			values ($1, $2, $3, $4, $5, $6, $7, $8)
			returning id, name, code, discount, usage_count, max_redemptions_per_user, max_total_redemptions, end_date, active, created_at
		`, input.Name, input.Code, input.Discount, input.UsageCount, input.MaxRedemptionsPerUser, input.MaxTotalRedemptions, input.EndDate, input.Active).Scan(
			&promotion.ID, &promotion.Name, &promotion.Code, &promotion.Discount, &promotion.UsageCount, &promotion.MaxRedemptionsPerUser, &promotion.MaxTotalRedemptions, &promotion.EndDate, &promotion.Active, &promotion.CreatedAt,
		)
	} else {
		err = s.db.QueryRow(r.Context(), `
			update promotions
			set name = $2,
			    code = $3,
			    discount = $4,
			    usage_count = $5,
			    max_redemptions_per_user = $6,
			    max_total_redemptions = $7,
			    end_date = $8,
			    active = $9
			where id = $1
			returning id, name, code, discount, usage_count, max_redemptions_per_user, max_total_redemptions, end_date, active, created_at
		`, id, input.Name, input.Code, input.Discount, input.UsageCount, input.MaxRedemptionsPerUser, input.MaxTotalRedemptions, input.EndDate, input.Active).Scan(
			&promotion.ID, &promotion.Name, &promotion.Code, &promotion.Discount, &promotion.UsageCount, &promotion.MaxRedemptionsPerUser, &promotion.MaxTotalRedemptions, &promotion.EndDate, &promotion.Active, &promotion.CreatedAt,
		)
	}

	return promotion, err
}
