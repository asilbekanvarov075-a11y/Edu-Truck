package main

import (
	"log"
	"os"

	"edutrack/database"
	"edutrack/handlers"
	"edutrack/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect DB
	database.Connect()
	database.Migrate()

	r := gin.Default()

	// CORS
	r.Use(middleware.CORS())

	// Serve frontend static files
	r.Static("/", "../public")

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired())
		{
			// Users
			protected.GET("/me", handlers.GetMe)

			// Students (admin/teacher only)
			students := protected.Group("/students")
			students.Use(middleware.RoleRequired("ADMIN", "TEACHER"))
			{
				students.GET("", handlers.GetStudents)
				students.GET("/:id", handlers.GetStudent)
			}

			// Grades
			grades := protected.Group("/grades")
			{
				grades.GET("", handlers.GetGrades)
				grades.POST("", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.CreateGrade)
				grades.DELETE("/:id", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.DeleteGrade)
			}

			// Assignments
			assignments := protected.Group("/assignments")
			{
				assignments.GET("", handlers.GetAssignments)
				assignments.POST("", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.CreateAssignment)
				assignments.PUT("/:id", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.UpdateAssignment)
				assignments.DELETE("/:id", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.DeleteAssignment)
			}

			// Attendance
			attendance := protected.Group("/attendance")
			{
				attendance.GET("", handlers.GetAttendance)
				attendance.POST("", middleware.RoleRequired("TEACHER", "ADMIN"), handlers.MarkAttendance)
			}

			// Admin only
			admin := protected.Group("/admin")
			admin.Use(middleware.RoleRequired("ADMIN"))
			{
				admin.GET("/users", handlers.GetAllUsers)
				admin.PUT("/users/:id/role", handlers.UpdateUserRole)
				admin.DELETE("/users/:id", handlers.DeleteUser)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("EduTrack Go server running on :%s", port)
	r.Run(":" + port)
}
