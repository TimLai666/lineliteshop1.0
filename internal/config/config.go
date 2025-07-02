package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

const devMode bool = false

var (
	// OLLAMA_BASE_URL     string
	LINE_CHANNEL_TOKEN     string
	LINE_CHANNEL_SECRET    string
	GOOGLE_SHEET_API_URL   string
	GOOGLE_SHEET_API_TOKEN string
)

func init() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
	// if devMode {
	// 	OLLAMA_BASE_URL = os.Getenv("OLLAMA_BASE_URL_DEV")
	// } else {
	// 	OLLAMA_BASE_URL = os.Getenv("OLLAMA_BASE_URL")
	// }
	LINE_CHANNEL_TOKEN = os.Getenv("LINE_CHANNEL_TOKEN")
	LINE_CHANNEL_SECRET = os.Getenv("LINE_CHANNEL_SECRET")

	GOOGLE_SHEET_API_URL = os.Getenv("GOOGLE_SHEET_API_URL")
	GOOGLE_SHEET_API_TOKEN = os.Getenv("GOOGLE_SHEET_API_TOKEN")
}
