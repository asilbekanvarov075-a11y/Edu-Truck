package handlers

import (
	"database/sql"
	"net/http"

	"edutrack/database"
	"edutrack/models"

	"github.com/gin-gonic/gin"
)

func GetGrades(c *gin.Context) {
	userID, _ := c.Get("userId")
	role, _ := c.Get("role")

	var rows *sql.Rows
	var err error

	if role == "STUDENT" {
		rows, err = database.DB.Query(
			`SELECT g.id, g.student_id, g.teacher_id, g.subject, g.value, COALESCE(g.comment,''), g.created_at
			 FROM grades g WHERE g.student_id=$1 ORDER BY g.created_at DESC`,
			userID,
		)
	} else if role == "TEACHER" {
		rows, err = database.DB.Query(
			`SELECT g.id, g.student_id, g.teacher_id, g.subject, g.value, COALESCE(g.comment,''), g.created_at
			 FROM grades g WHERE g.teacher_id=$1 ORDER BY g.created_at DESC`,
			userID,
		)
	} else {
		rows, err = database.DB.Query(
			`SELECT g.id, g.student_id, g.teacher_id, g.subject, g.value, COALESCE(g.comment,''), g.created_at
			 FROM grades g ORDER BY g.created_at DESC`,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ma'lumot olishda xato"})
		return
	}
	defer rows.Close()

	grades := []models.Grade{}
	for rows.Next() {
		var g models.Grade
		rows.Scan(&g.ID, &g.StudentID, &g.TeacherID, &g.Subject, &g.Value, &g.Comment, &g.CreatedAt)
		grades = append(grades, g)
	}

	c.JSON(http.StatusOK, grades)
}

func CreateGrade(c *gin.Context) {
	teacherID, _ := c.Get("userId")

	var req models.CreateGradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var g models.Grade
	err := database.DB.QueryRow(
		`INSERT INTO grades (student_id, teacher_id, subject, value, comment)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, student_id, teacher_id, subject, value, COALESCE(comment,''), created_at`,
		req.StudentID, teacherID, req.Subject, req.Value, req.Comment,
	).Scan(&g.ID, &g.StudentID, &g.TeacherID, &g.Subject, &g.Value, &g.Comment, &g.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Baho qo'shilmadi"})
		return
	}

	c.JSON(http.StatusCreated, g)
}

func DeleteGrade(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := c.Get("userId")
	role, _ := c.Get("role")

	var query string
	var args []interface{}

	if role == "ADMIN" {
		query = "DELETE FROM grades WHERE id=$1"
		args = []interface{}{id}
	} else {
		query = "DELETE FROM grades WHERE id=$1 AND teacher_id=$2"
		args = []interface{}{id, teacherID}
	}

	res, err := database.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "O'chirishda xato"})
		return
	}

	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Baho topilmadi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "O'chirildi"})
}
