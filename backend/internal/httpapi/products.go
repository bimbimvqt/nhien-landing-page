package httpapi

import (
	"net/http"

	"github.com/google/uuid"
)

func (s *Server) listProducts(w http.ResponseWriter, r *http.Request) {
	limit := parseLimit(r, 100, 500)
	bestSellerOnly := r.URL.Query().Get("best_seller") == "true"

	query := `
		select id, name, description, price_s, price_m, category, sub_category, image_url, is_best_seller, created_at
		from products
		where ($1::boolean = false or is_best_seller = true)
		order by category asc, is_best_seller desc, created_at desc
		limit $2
	`

	rows, err := s.db.Query(r.Context(), query, bestSellerOnly, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var product Product
		if err := rows.Scan(
			&product.ID,
			&product.Name,
			&product.Description,
			&product.PriceS,
			&product.PriceM,
			&product.Category,
			&product.SubCategory,
			&product.ImageURL,
			&product.IsBestSeller,
			&product.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		products = append(products, product)
	}

	if rows.Err() != nil {
		writeError(w, http.StatusInternalServerError, rows.Err().Error())
		return
	}

	writeJSON(w, http.StatusOK, products)
}

func (s *Server) createProduct(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	var input Product
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := s.saveProduct(r, uuid.Nil, input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, product)
}

func (s *Server) updateProduct(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	id, ok := parseUUIDPath(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	var input Product
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := s.saveProduct(r, id, input)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, product)
}

func (s *Server) deleteProduct(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}

	id, ok := parseUUIDPath(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	tag, err := s.db.Exec(r.Context(), `delete from products where id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "product not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) saveProduct(r *http.Request, id uuid.UUID, input Product) (Product, error) {
	input.Name = normalizeText(input.Name)
	input.Category = normalizeText(input.Category)
	if input.Name == "" || input.Category == "" {
		return Product{}, errValidation("name and category are required")
	}

	var product Product
	var err error
	if id == uuid.Nil {
		err = s.db.QueryRow(r.Context(), `
			insert into products (name, description, price_s, price_m, category, sub_category, image_url, is_best_seller)
			values ($1, $2, $3, $4, $5, $6, $7, $8)
			returning id, name, description, price_s, price_m, category, sub_category, image_url, is_best_seller, created_at
		`, input.Name, input.Description, input.PriceS, input.PriceM, input.Category, input.SubCategory, input.ImageURL, input.IsBestSeller).Scan(
			&product.ID, &product.Name, &product.Description, &product.PriceS, &product.PriceM, &product.Category, &product.SubCategory, &product.ImageURL, &product.IsBestSeller, &product.CreatedAt,
		)
	} else {
		err = s.db.QueryRow(r.Context(), `
			update products
			set name = $2,
			    description = $3,
			    price_s = $4,
			    price_m = $5,
			    category = $6,
			    sub_category = $7,
			    image_url = $8,
			    is_best_seller = $9
			where id = $1
			returning id, name, description, price_s, price_m, category, sub_category, image_url, is_best_seller, created_at
		`, id, input.Name, input.Description, input.PriceS, input.PriceM, input.Category, input.SubCategory, input.ImageURL, input.IsBestSeller).Scan(
			&product.ID, &product.Name, &product.Description, &product.PriceS, &product.PriceM, &product.Category, &product.SubCategory, &product.ImageURL, &product.IsBestSeller, &product.CreatedAt,
		)
	}

	return product, err
}
