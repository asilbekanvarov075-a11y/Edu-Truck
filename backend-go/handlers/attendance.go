package handlers

import (
	"net/http"

	"edutrack/database"
	"edutrack/models"

	"github.com/gin-gonic/gin"
)

func GetAttendance(c *gin.Context) {
	userID, _ := c.Get("userId")
	role, _ := c.Get("role")

	var rows interface{ Close() error }
	var err error

	if role == "STUDENT" {
		rows, err = database.DB.Query(
			`SELECT id, student_id, teacher_id, subject, date::text, status, created_at
			 FROM attendance WHERE student_id=$1 ORDER BY date DESC`,
			userID,
		)
	} else {
		rows, err = database.DB.Query(
			`SELECT id, student_id, teacher_id, subject, date::text, status, created_at
			 FROM attendance ORDER BY date DESC`,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ma'lumot olishda xato"})
		return
	}

	type rowScanner interface {
		Next() bool
		Scan(dest ...interface{}) error
		Close() error
	}

	scanner := rows.(rowScanner)
	defer scanner.Close()

	records := []models.Attendance{}
	for scanner.Next() {
		var a models.Attendance
		scanner.Scan(&a.ID, &a.StudentID, &a.TeacherID, &a.Subject, &a.Date, &a.Status, &a.CreatedAt)
		records = append(records, a)
	}

	c.JSON(http.StatusOK, records)
}

func MarkAttendance(c *gin.Context) {
	teacherID, _ := c.Get("userId")

	var req models.MarkAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var a models.Attendance
	err := database.DB.QueryRow(
		`INSERT INTO attendance (student_id, teacher_id, subject, date, status)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (student_id, subject, date) DO UPDATE SET status=EXCLUDED.status
		 RETURNING id, student_id, teacher_id, subject, date::text, status, created_at`,
		req.StudentID, teacherID, req.Subject, req.Date, req.Status,
	).Scan(&a.ID, &a.StudentID, &a.TeacherID, &a.Subject, &a.Date, &a.Status, &a.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Davomat belgilanmadi"})
		return
	}

	c.JSON(http.StatusCreated, a)
}
