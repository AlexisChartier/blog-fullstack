.PHONY: help up down build install backend-install frontend-install migrate migrate-fresh seed test backend-test frontend-test backend-tinker backend-artisan frontend-serve dev logs ps

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all containers
	docker compose up -d

down: ## Stop all containers
	docker compose down

build: ## Build containers
	docker compose build

install: backend-install frontend-install ## Install all dependencies

backend-install: ## Install backend dependencies
	docker compose exec backend composer install

frontend-install: ## Install frontend dependencies
	docker compose exec frontend npm install

migrate: ## Run database migrations
	docker compose exec backend php artisan migrate

migrate-fresh: ## Run migrations fresh with seeders
	docker compose exec backend php artisan migrate:fresh --seed

seed: ## Run database seeders
	docker compose exec backend php artisan db:seed

test: backend-test frontend-test ## Run all tests

backend-test: ## Run backend tests
	docker compose exec backend php artisan test

frontend-test: ## Run frontend tests
	docker compose exec frontend npm run test -- --watch=false

backend-tinker: ## Run Laravel tinker
	docker compose exec backend php artisan tinker

backend-artisan: ## Run artisan command (make backend-artisan CMD="command")
	docker compose exec backend php artisan $(CMD)

dev: up ## Start development environment
	@echo ""
	@echo "Development environment started:"
	@echo "  Frontend:  http://localhost:8080"
	@echo "  API:       http://localhost:8080/api"
	@echo "  Adminer:   http://localhost:8081"
	@echo ""

logs: ## Show container logs
	docker compose logs -f

ps: ## Show running containers
	docker compose ps
