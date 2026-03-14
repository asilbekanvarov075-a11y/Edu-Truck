package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/edutrack?sslmode=disable"
	}

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}

	log.Println("Database connected")
}

func Migrate() {
	queries := []string{
		`CREATE TYPE IF NOT EXISTS user_role AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'ADMIN')`,

		`CREATE TABLE IF NOT EXISTS users (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email       TEXT UNIQUE,
			password    TEXT NOT NULL,
			role        user_role NOT NULL DEFAULT 'STUDENT',
			first_name  TEXT NOT NULL,
			last_name   TEXT NOT NULL,
			is_active   BOOLEAN DEFAULT true,
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			updated_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS grades (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			teacher_id  UUID NOT NULL REFERENCES users(id),
			subject     TEXT NOT NULL,
			value       NUMERIC(5,2) NOT NULL,
			comment     TEXT,
			created_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS assignments (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title       TEXT NOT NULL,
			description TEXT,
			subject     TEXT NOT NULL,
			teacher_id  UUID NOT NULL REFERENCES users(id),
			due_date    TIMESTAMPTZ NOT NULL,
			max_points  INT DEFAULT 100,
			created_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS attendance (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			teacher_id  UUID NOT NULL REFERENCES users(id),
			subject     TEXT NOT NULL,
			date        DATE NOT NULL,
			status      TEXT NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(student_id, subject, date)
		)`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Printf("Migration warning: %v", err)
		}
	}

	log.Println("Database migrations done")
}
