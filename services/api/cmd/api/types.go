package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

// RFC 7807 Problem Details
type ProblemDetails struct {
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Status    int         `json:"status"`
	Detail    string      `json:"detail"`
	Code      string      `json:"code"`
	RequestID string      `json:"request_id"`
	Errors    interface{} `json:"field_errors,omitempty"`
}

func writeProblem(w http.ResponseWriter, status int, code, title, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ProblemDetails{
		Type:      "about:blank",
		Title:     title,
		Status:    status,
		Code:      code,
		Detail:    detail,
		RequestID: uuid.New().String(),
	})
}
