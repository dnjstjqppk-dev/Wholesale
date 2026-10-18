package main

import (
	"net/http"
)

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()
	s.registerCatalogRoutes(mux)
	s.registerSourcingRoutes(mux)
	s.registerTradeRoutes(mux)
	s.registerLogisticsAndSettlementRoutes(mux)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Organization-ID, Idempotency-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})
}

