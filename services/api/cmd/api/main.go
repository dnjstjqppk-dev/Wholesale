package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "bootstrap-admin" {
		adminID := uuid.New()
		oneTimeToken := uuid.New().String()
		fmt.Printf("[BOOTSTRAP] Initial Platform Admin Created: ID=%s Email=admin@wholesale.internal Token=%s Role=PLATFORM_ADMIN\n", adminID, oneTimeToken)
		return
	}

	srv := NewServer()
	port := "8080"
	log.Printf("[WHOLESALE B2B Core API] Server listening on :%s ...", port)
	if err := http.ListenAndServe(":"+port, srv.routes()); err != nil {
		log.Fatalf("Server terminated: %v", err)
	}
}
