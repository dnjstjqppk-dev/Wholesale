package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log.Println("[WHOLESALE Background Worker] Starting outbox and reconciliation worker...")
	w := NewWorker()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go w.RunBackgroundLoop(ctx, 5*time.Second)

	<-sigChan
	log.Println("[WHOLESALE Background Worker] Shutting down gracefully...")
	cancel()
	time.Sleep(1 * time.Second)
	log.Println("[WHOLESALE Background Worker] Terminated.")
}
