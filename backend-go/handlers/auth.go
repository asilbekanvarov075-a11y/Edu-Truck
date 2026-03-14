package handlers

import (
	"net/http"
	"os"
	"time"

	"edutrack/database"
	"edutrack/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check email exists
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email=$1", req.Email).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Bu email allaqachon ro'yxatdan o'tgan"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server xatosi"})
		return
	}

	var user models.User
	err = database.DB.QueryRow(
		`INSERT INTO users (email, password, role, first_name, last_name)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, email, role, first_name, last_name, is_active, created_at`,
		req.Email, string(hash), req.Role, req.FirstName, req.LastName,
	).Scan(&user.ID, &user.Email, &user.Role, &user.FirstName, &user.LastName, &user.IsActive, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Foydalanuvchi yaratilmadi"})
		return
	}

	token := generateToken(user.ID, user.Role)
	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := database.DB.QueryRow(
		`SELECT id, email, password, role, first_name, last_name, is_active, created_at
		 FROM users WHERE email=$1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.Role, &user.FirstName, &user.LastName, &user.IsActive, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email yoki parol noto'g'ri"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akkaunt bloklangan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email yoki parol noto'g'ri"})
		return
	}

	token := generateToken(user.ID, user.Role)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func GetMe(c *gin.Context) {
	userID, _ := c.Get("userId")

	var user models.User
	err := database.DB.QueryRow(
		`SELECT id, email, role, first_name, last_name, is_active, created_at
		 FROM users WHERE id=$1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Role, &user.FirstName, &user.LastName, &user.IsActive, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Foydalanuvchi topilmadi"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func generateToken(userID, role string) string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "edutrack-secret-key"
	}

	claims := jwt.MapClaims{
		"userId": userID,
		"role":   role,
		"exp":    time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	return token
}
