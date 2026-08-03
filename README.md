# Course Management System

A full-stack web application that simplifies course signup management by connecting administrators, teaching assistants, and students through a role-based scheduling and grading platform.

The system allows administrators to manage users and courses, teaching assistants to create signup sessions and grade students, and students to view available time slots and reserve their appointments.

## Features

### Authentication & Authorization

* User registration and login with JWT-based authentication
* Role-based access control for Admin, TA, and Student users
* Secure password storage using password hashing

### Admin Features

* Manage user accounts
* Create and manage courses
* Assign users with different roles

### Teaching Assistant Features

* Create signup sheets for courses and assignments
* Generate and manage available time slots
* View student signups
* Grade students and provide feedback
* Maintain grading history for tracking updates

### Student Features

* Browse available signup sessions
* Register for available time slots
* Leave registered slots when allowed
* View personal signup information and grades

## Tech Stack

### Frontend

* React
* JavaScript
* HTML/CSS
* React Hooks
* Responsive UI components

### Backend

* Node.js
* Express.js
* RESTful APIs
* JWT Authentication
* bcrypt Password Hashing

### Database

* MongoDB
* Mongoose ODM

### Deployment

* Vercel (Frontend)
* Render (Backend)
* MongoDB Atlas (Database)

## System Architecture

```
Frontend (React)
        |
        | REST API
        |
Backend (Node.js + Express)
        |
        |
Database (MongoDB)
```

## Key Implementation Highlights

* Designed RESTful APIs for user authentication, course management, signup scheduling, and grading workflows
* Implemented MongoDB data models for users, courses, signup sheets, slots, and grading records
* Developed role-based functionality to support different user workflows
* Built scheduling logic to prevent conflicting time slots and enforce signup rules
* Implemented grading history tracking to preserve previous feedback and score changes

## Future Improvements

* Add email notifications for signup confirmations and reminders
* Improve UI/UX with additional filtering and calendar-based scheduling
* Add automated testing for frontend components and backend APIs
* Implement cloud-based file storage for assignment-related resources

## Demo

Demo accounts:

| Role    | Email                                             | Password |
| ------- | ------------------------------------------------- | -------- |
| Admin   | admin@email.com     | password  |
| TA      | mike.smith@email.com           | password  |
| Student | john.doe@testmail.com | john  |

## License

This project is for demonstration and educational purposes.

