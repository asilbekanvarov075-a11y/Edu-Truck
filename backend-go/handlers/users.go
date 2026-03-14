package handlers

import (
	"net/http"

	"edutrack/database"
	"edutrack/models"

	"github.com/gin-gonic/gin"
)

func GetStudents(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, email, role, first_name, last_name, is_active, created_at
		 FROM users WHERE role='STUDENT' AND is_active=true ORDER BY last_name`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xato"})
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.IsActive, &u.CreatedAt)
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

func GetStudent(c *gin.Context) {
	id := c.Param("id")

	var u models.User
	err := database.DB.QueryRow(
		`SELECT id, email, role, first_name, last_name, is_active, created_at
		 FROM users WHERE id=$1 AND role='STUDENT'`,
		id,
	).Scan(&u.ID, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.IsActive, &u.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "O'quvchi topilmadi"})
		return
	}

	c.JSON(http.StatusOK, u)
}

func GetAllUsers(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, email, role, first_name, last_name, is_active, created_at
		 FROM users ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xato"})
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.IsActive, &u.CreatedAt)
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Role string `json:"role" binding:"required,oneof=STUDENT TEACHER PARENT ADMIN"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := database.DB.Exec(
		"UPDATE users SET role=$1 WHERE id=$2",
		body.Role, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yangilanmadi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rol yangilandi"})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	_, err := database.DB.Exec("UPDATE users SET is_active=false WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xato"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Foydalanuvchi bloklandi"})
}
