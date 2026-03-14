package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Role      string    `json:"role"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=STUDENT TEACHER PARENT"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type Grade struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	TeacherID string    `json:"teacherId"`
	Subject   string    `json:"subject"`
	Value     float64   `json:"value"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
}

type CreateGradeRequest struct {
	StudentID string  `json:"studentId" binding:"required"`
	Subject   string  `json:"subject" binding:"required"`
	Value     float64 `json:"value" binding:"required,min=0,max=100"`
	Comment   string  `json:"comment"`
}

type Assignment struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Subject     string    `json:"subject"`
	TeacherID   string    `json:"teacherId"`
	DueDate     time.Time `json:"dueDate"`
	MaxPoints   int       `json:"maxPoints"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CreateAssignmentRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Subject     string    `json:"subject" binding:"required"`
	DueDate     time.Time `json:"dueDate" binding:"required"`
	MaxPoints   int       `json:"maxPoints"`
}

type Attendance struct {
	ID        string    `json:"id"`
	StudentID string    `json:"studentId"`
	TeacherID string    `json:"teacherId"`
	Subject   string    `json:"subject"`
	Date      string    `json:"date"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type MarkAttendanceRequest struct {
	StudentID string `json:"studentId" binding:"required"`
	Subject   string `json:"subject" binding:"required"`
	Date      string `json:"date" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=PRESENT ABSENT LATE EXCUSED"`
}
