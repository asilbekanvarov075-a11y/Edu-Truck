package handlers

import (
	"net/http"

	"edutrack/database"
	"edutrack/models"

	"github.com/gin-gonic/gin"
)

func GetAssignments(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, title, description, subject, teacher_id, due_date, max_points, created_at
		 FROM assignments ORDER BY due_date ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ma'lumot olishda xato"})
		return
	}
	defer rows.Close()

	assignments := []models.Assignment{}
	for rows.Next() {
		var a models.Assignment
		rows.Scan(&a.ID, &a.Title, &a.Description, &a.Subject, &a.TeacherID, &a.DueDate, &a.MaxPoints, &a.CreatedAt)
		assignments = append(assignments, a)
	}

	c.JSON(http.StatusOK, assignments)
}

func CreateAssignment(c *gin.Context) {
	teacherID, _ := c.Get("userId")

	var req models.CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.MaxPoints == 0 {
		req.MaxPoints = 100
	}

	var a models.Assignment
	err := database.DB.QueryRow(
		`INSERT INTO assignments (title, description, subject, teacher_id, due_date, max_points)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, title, description, subject, teacher_id, due_date, max_points, created_at`,
		req.Title, req.Description, req.Subject, teacherID, req.DueDate, req.MaxPoints,
	).Scan(&a.ID, &a.Title, &a.Description, &a.Subject, &a.TeacherID, &a.DueDate, &a.MaxPoints, &a.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Vazifa yaratilmadi"})
		return
	}

	c.JSON(http.StatusCreated, a)
}

func UpdateAssignment(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := c.Get("userId")

	var req models.CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := database.DB.Exec(
		`UPDATE assignments SET title=$1, description=$2, subject=$3, due_date=$4, max_points=$5
		 WHERE id=$6 AND teacher_id=$7`,
		req.Title, req.Description, req.Subject, req.DueDate, req.MaxPoints, id, teacherID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yangilanmadi"})
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topilmadi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Yangilandi"})
}

func DeleteAssignment(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := c.Get("userId")
	role, _ := c.Get("role")

	var err error
	if role == "ADMIN" {
		_, err = database.DB.Exec("DELETE FROM assignments WHERE id=$1", id)
	} else {
		_, err = database.DB.Exec("DELETE FROM assignments WHERE id=$1 AND teacher_id=$2", id, teacherID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "O'chirishda xato"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "O'chirildi"})
}
