package httpapi

import "net/http"

func (s *Server) getStoreSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := s.fetchStoreSettings(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, settings)
}

func (s *Server) updateStoreSettings(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	var input StoreSettings
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	settings, err := s.saveStoreSettings(r, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, settings)
}

func (s *Server) fetchStoreSettings(r *http.Request) (StoreSettings, error) {
	var settings StoreSettings
	err := s.db.QueryRow(r.Context(), `
		select id, brand_name, hotline, address, facebook_url, instagram_url, map_embed_url, hero_image_url, opening_hours, about_image_url, about_title, about_description_1, about_description_2, about_stats, gallery, required_tasks_to_claim, reward_tasks, member_tiers, updated_at
		from store_settings
		where id = 1
	`).Scan(
		&settings.ID,
		&settings.BrandName,
		&settings.Hotline,
		&settings.Address,
		&settings.FacebookURL,
		&settings.InstagramURL,
		&settings.MapEmbedURL,
		&settings.HeroImageURL,
		&settings.OpeningHours,
		&settings.AboutImageURL,
		&settings.AboutTitle,
		&settings.AboutDescription1,
		&settings.AboutDescription2,
		&settings.AboutStats,
		&settings.Gallery,
		&settings.RequiredTasksToClaim,
		&settings.RewardTasks,
		&settings.MemberTiers,
		&settings.UpdatedAt,
	)
	return settings, err
}

func (s *Server) saveStoreSettings(r *http.Request, input StoreSettings) (StoreSettings, error) {
	input.BrandName = normalizeText(input.BrandName)
	input.Hotline = normalizeText(input.Hotline)
	input.Address = normalizeText(input.Address)
	if input.BrandName == "" || input.Hotline == "" || input.Address == "" {
		return StoreSettings{}, errValidation("brand_name, hotline and address are required")
	}
	if len(input.OpeningHours) == 0 {
		return StoreSettings{}, errValidation("opening_hours is required")
	}
	if input.RequiredTasksToClaim <= 0 {
		input.RequiredTasksToClaim = 2
	}

	var settings StoreSettings
	err := s.db.QueryRow(r.Context(), `
		update store_settings
		set brand_name = $1,
		    hotline = $2,
		    address = $3,
		    facebook_url = $4,
		    instagram_url = $5,
		    map_embed_url = $6,
		    hero_image_url = $7,
		    opening_hours = $8,
		    about_image_url = $9,
		    about_title = $10,
		    about_description_1 = $11,
		    about_description_2 = $12,
		    about_stats = $13,
		    gallery = $14,
		    required_tasks_to_claim = $15,
		    reward_tasks = $16,
		    member_tiers = $17
		where id = 1
		returning id, brand_name, hotline, address, facebook_url, instagram_url, map_embed_url, hero_image_url, opening_hours, about_image_url, about_title, about_description_1, about_description_2, about_stats, gallery, required_tasks_to_claim, reward_tasks, member_tiers, updated_at
	`, input.BrandName, input.Hotline, input.Address, input.FacebookURL, input.InstagramURL, input.MapEmbedURL, input.HeroImageURL, input.OpeningHours, input.AboutImageURL, input.AboutTitle, input.AboutDescription1, input.AboutDescription2, input.AboutStats, input.Gallery, input.RequiredTasksToClaim, input.RewardTasks, input.MemberTiers).Scan(
		&settings.ID,
		&settings.BrandName,
		&settings.Hotline,
		&settings.Address,
		&settings.FacebookURL,
		&settings.InstagramURL,
		&settings.MapEmbedURL,
		&settings.HeroImageURL,
		&settings.OpeningHours,
		&settings.AboutImageURL,
		&settings.AboutTitle,
		&settings.AboutDescription1,
		&settings.AboutDescription2,
		&settings.AboutStats,
		&settings.Gallery,
		&settings.RequiredTasksToClaim,
		&settings.RewardTasks,
		&settings.MemberTiers,
		&settings.UpdatedAt,
	)

	return settings, err
}
