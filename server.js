const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(express.json());

app.use(cors());

// creating databse if not exists ------------------------------------------------------------------------------------------------------
// Create a connection to the MySQL server (without specifying a database)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
  });

  // Check if database exists, if not create it
connection.query("CREATE DATABASE IF NOT EXISTS stba", (err, result) => {
    if (err) {
      console.error("Error creating database:", err);
      return;
    }
    console.log("Database created or already exists");
  });


// Creating a connection to the MySQL database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "stba"
});


// Handle database connection errors
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// creating all the required tables if not Exists ---------------------------------------------------------------------------------------------
// creating login table if not exists 
const createLoginTableQuery = `
  CREATE TABLE IF NOT EXISTS login_table (
    User_Id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    User_Email VARCHAR(200) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Description VARCHAR(50) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createLoginTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'login' table:", err);
      return;
    }
    console.log("Table 'login' created or already exists.");
  });


// creating appointment table if not exists 
const createAppointmentTableQuery = `
  CREATE TABLE IF NOT EXISTS appointment_table (
    S_no INT(11) AUTO_INCREMENT PRIMARY KEY,
    Teacher_Name VARCHAR(100) NOT NULL,
    Teacher_Department VARCHAR(100) NOT NULL,
    Student_Name VARCHAR(100) NOT NULL,
    Student_Email VARCHAR(50) NOT NULL,
    Student_Phone VARCHAR(15) NOT NULL,
    Student_Subject VARCHAR(100) NOT NULL,
    Date_of_Appointment VARCHAR(50) NOT NULL,
    Appointment_Details VARCHAR(255) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createAppointmentTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'appointment' table:", err);
      return;
    }
    console.log("Table 'appointment' created or already exists.");
  });


// creating scheduled appointment table if not exists 
const createScheduledAppointmentTableQuery = `
  CREATE TABLE IF NOT EXISTS scheduled_appointment_table (
    S_no INT(11) AUTO_INCREMENT PRIMARY KEY,
    Teacher_Name VARCHAR(100) NOT NULL,
    Teacher_Department VARCHAR(100) NOT NULL,
    Student_Name VARCHAR(100) NOT NULL,
    Student_Email VARCHAR(50) NOT NULL,
    Student_Phone VARCHAR(15) NOT NULL,
    Student_Subject VARCHAR(100) NOT NULL,
    Date_of_Appointment VARCHAR(50) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createScheduledAppointmentTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'scheduled appointment' table:", err);
      return;
    }
    console.log("Table 'scheduled appointment' created or already exists.");
  });


// creating student Message table if not exists 
const createStudentMessageTableQuery = `
  CREATE TABLE IF NOT EXISTS student_message_table (
    S_no INT(11) AUTO_INCREMENT PRIMARY KEY,
    Teacher_Name VARCHAR(100) NOT NULL,
    Teacher_Department VARCHAR(100) NOT NULL,
    Student_Name VARCHAR(100) NOT NULL,
    Student_Email VARCHAR(50) NOT NULL,
    Student_Phone VARCHAR(15) NOT NULL,
    Student_Message VARCHAR(255) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createStudentMessageTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'student Message' table:", err);
      return;
    }
    console.log("Table 'student Message' created or already exists.");
  });


// creating student Registration request table if not exists 
const createStudentRegistrationRequestTableQuery = `
  CREATE TABLE IF NOT EXISTS student_registration_request_table (
    S_no  INT(11) AUTO_INCREMENT PRIMARY KEY,
    Student_Name VARCHAR(100) NOT NULL,
    Student_Password VARCHAR(255) NOT NULL,
    Student_Email VARCHAR(50) NOT NULL,
    Student_Age int(4) NOT NULL,
    Student_Phone varchar(15) NOT NULL,
    Student_Gender varchar(50) NOT NULL,
    Student_Department varchar(100) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createStudentRegistrationRequestTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'student Registration request' table:", err);
      return;
    }
    console.log("Table 'student Registration request' created or already exists.");
  });


// creating  student details table if not exists 
const createStudentTableQuery = `
  CREATE TABLE IF NOT EXISTS student_table (
    Student_ID INT(4) AUTO_INCREMENT PRIMARY KEY,
    Student_Name VARCHAR(50) NOT NULL,
    Student_Email VARCHAR(50) NOT NULL,
    Student_Age INT(4) NOT NULL,
    Student_Phone VARCHAR(15) NOT NULL,
    Student_Gender VARCHAR(50) NOT NULL,
    Student_Department VARCHAR(100) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createStudentTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'student' table:", err);
      return;
    }
    console.log("Table 'student' created or already exists.");
  });


// creating teachers details table if not exists 
const createTeachersTableQuery = `
  CREATE TABLE IF NOT EXISTS teacher_table (
    Teacher_Id INT(6) AUTO_INCREMENT PRIMARY KEY,
    Teacher_Name VARCHAR(50) NOT NULL,
    Teacher_Email VARCHAR(50) NOT NULL,
    Teacher_PhoneNo VARCHAR(15) NOT NULL,
    Teacher_Gender VARCHAR(50) NOT NULL,
    Teacher_Age VARCHAR(10) NOT NULL,
    Teacher_Department VARCHAR(100) NOT NULL,
    Teacher_Subject VARCHAR(100) NOT NULL,
    Date datetime DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createTeachersTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating 'teacher' table:", err);
      return;
    }
    console.log("Table 'teacher' created or already exists.");
  });


// setting up for sending E-Mails --------------------------------------------------------------------------------------------

// Create a transporter object using the default SMTP transport to send emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sswayam211@gmail.com', // Your email address
        pass: 'qwqz gytz hhfu tqqp'    // Your email password or application-specific password
    }
});


const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Use environment variables for sender address
        to: to,                       // List of receivers
        subject: subject,            // Subject line
        text: text                   // Plain text body
    };

    return transporter.sendMail(mailOptions);
};


// login and registration funtions ----------------------------------------------------------------------------------------

// user authentication on login page
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM login_table WHERE (Username = ? OR User_Email = ?)  AND Password = ?"; //querry to select data from login table

    // Using placeholders (?) to prevent SQL injection
    const values = [req.body.username, req.body.username, req.body.password]; //values which comes from user from login page

    db.query(sql, values, (err, data) => {    //querry for database
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err }); //505 : database error 
        }

        if (data.length > 0) {
            // Assuming data[0] contains user data including an id
            const user = data[0];
            const token = jwt.sign({ userId: user.User_Id }, 'your_secret_key', { expiresIn: '1h' }); // Generate JWT
            return res.status(200).json({ message: 'Login successful', token }); //returning token to save in local storage for future use
        } else {
            return res.status(401).json({ message: 'Login failed, incorrect username or password' }); // message for login fail
        }
    });
});


// registering new student to request table in database 
app.post('/registerstudent', (req, res) => {
    const { name, password, email, phone, gender, age, department, subject, description } = req.body; //taking values from registration page for registration

    // SQL query for new registration into the registration request table
    const sql = 'INSERT INTO student_registration_request_table (Student_Name, Student_Password, Student_Email, Student_Age, Student_Phone,	Student_Gender, Student_Department) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(sql, [name, password, email, age, phone, gender, department], (err, result2) => {
        if (err) {
            console.error('Error inserting Teacher into teacher table:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        // Respond only after both queries have succeeded
        res.status(201).json({ message: 'Student Registered Successfully' });
    });
});


// Endpoint to fetch user details based on token for login (fetching user data who loged in successfully)
app.get('/user', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header

    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Failed to authenticate token' });

        const userId = decoded.userId;
        const sql = "SELECT * FROM login_table WHERE User_Id = ?";

        db.query(sql, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            if (results.length > 0) {
                res.json(results[0]); // Send user details
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        });
    });
});


// admin functions --------------------------------------------------------------------------------------------------------------------------------------------------

// Adding new teacher to the database in teacher details table and login table as well
app.post('/addteacher', (req, res) => {
    const { name, password, email, phone, gender, age, department, subject, description } = req.body;

    // SQL query to insert a new teacher into the login table
    const sql1 = 'INSERT INTO login_table (Username,User_Email, Password, Description) VALUES (?,?, ?, ?)';

    db.query(sql1, [name, email, password, description], (err, result1) => {
        if (err) {
            console.error('Error inserting Teacher into login table:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        // SQL query to insert a new teacher into the teacher table
        const sql2 = 'INSERT INTO teacher_table (Teacher_Name, Teacher_Email, Teacher_PhoneNo, Teacher_Gender, Teacher_Age, Teacher_Department, Teacher_Subject) VALUES (?, ?, ?, ?, ?, ?, ?)';

        db.query(sql2, [name, email, phone, gender, age, department, subject], (err, result2) => {
            if (err) {
                console.error('Error inserting Teacher into teacher table:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            // Respond only after both queries have succeeded
            res.status(201).json({ message: 'Teacher registered successfully' });
        });
    });
});


// Endpoint to search for a teacher by name and department
app.get('/searchteacher', (req, res) => {
    const { name, department } = req.query; // Expecting query parameters

    const sql = `
        SELECT * FROM teacher_table 
        WHERE Teacher_Name LIKE ? 
        AND Teacher_Department LIKE ?
    `;

    db.query(sql, [`%${name}%`, `%${department}%`], (err, results) => {
        if (err) {
            console.error('Error searching for teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ message: 'No teachers found matching your search criteria.' });
        }
    });
});


// deleting searched teacher records from table 
app.delete('/deleteTeacher/:teacherName/:teacherEmail', (req, res) => {
    const teacherName = req.params.teacherName;
    const teacherEmail = req.params.teacherEmail;

    // SQL query to delete from teacher_table
    const deleteFromTeacherTable = 'DELETE FROM teacher_table WHERE Teacher_Name = ? AND Teacher_Email = ?';

    // SQL query to delete from login_table
    const deleteFromLoginTable = 'DELETE FROM login_table WHERE Username = ? AND User_Email = ?';

    // Delete from teacher_table first
    db.query(deleteFromTeacherTable, [teacherName, teacherEmail], (err, result) => {
        if (err) {
            console.error('Error deleting from teacher_table:', err);
            return res.status(500).json({ message: 'Server error while deleting from teacher table' });
        }

        // If no records affected, teacher not found in teacher_table
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found in teacher table' });
        }

        // Proceed to delete from login_table
        db.query(deleteFromLoginTable, [teacherName, teacherEmail], (err, result) => {
            if (err) {
                console.error('Error deleting from login_table:', err);
                return res.status(500).json({ message: 'Server error while deleting from login table' });
            }

            // If no records affected, teacher not found in login_table
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Teacher not found in login table' });
            }

            // If both deletions are successful
            return res.status(200).json({ message: 'Teacher deleted successfully from both tables' });
        });
    });
});


//update searched teacher details in database 
app.put('/updateteacher', (req, res) => {
    const { name, email, phone, age, department, subject } = req.body;

    // SQL query to update the teacher_table
    const updateTeacherTable = `
        UPDATE teacher_table 
        SET 
            Teacher_Email = ?, 
            Teacher_PhoneNo = ?, 
            Teacher_Age = ?, 
            Teacher_Department = ?, 
            Teacher_Subject = ?
        WHERE 
            Teacher_Name = ?
    `;

    // SQL query to update the login_table
    const updateLoginTable = `
        UPDATE login_table 
        SET 
            User_Email = ?
        WHERE 
            Username = ?
    `;

    // First, updating the teacher_table
    db.query(updateTeacherTable, [email, phone, age, department, subject, name], (err, result) => {
        if (err) {
            console.error('Error updating teacher details in teacher_table:', err);
            return res.status(500).json({ message: 'Server error while updating teacher table' });
        }

        // Check if any rows were affected, meaning the teacher exists
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found in teacher_table' });
        }

        // Now, update the login_table
        db.query(updateLoginTable, [email, name], (err, result) => {
            if (err) {
                console.error('Error updating teacher details in login_table:', err);
                return res.status(500).json({ message: 'Server error while updating login table' });
            }

            // Check if any rows were affected in login_table
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Teacher not found in login_table' });
            }

            // If both updates are successful
            res.status(200).json({ message: 'Teacher details updated successfully in both tables!' });
        });
    });
});


// showing unapproved requests on screen 
app.get('/unapprovedrequest', (req, res) => {
    // const { name, department } = req.query; // Expecting query parameters

    const sql = `
        SELECT * FROM student_registration_request_table
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error searching for teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ message: 'No teachers found matching your search criteria.' });
        }
    });
});


// approveing request and saving user data to login and student details table and sending email to student on given email address regarding approval
app.put('/approverequest/:studentSno', (req, res) => {
    const studentSno = req.params.studentSno;

    //querry to get student data from registration request table
    const getStudentQuery = `SELECT * FROM student_registration_request_table WHERE S_no = ?`;
    
    //querry to into student table
    const insertStudentQuery = `
        INSERT INTO student_table (Student_Name, Student_Email, Student_Age, Student_Phone, Student_Gender, Student_Department)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    //querry to insert into login table
    const insertLoginQuery = `
        INSERT INTO login_table (Username, User_Email, Password, Description)
        VALUES (?, ?, ?, 'student')
    `;

    // querry to delete student from student request table
    const deleteRequestQuery = `DELETE FROM student_registration_request_table WHERE S_no = ?`;

    db.query(getStudentQuery, [studentSno], (err, studentData) => {
        if (err) {
            console.error('Error retrieving student data:', err);
            return res.status(500).json({ message: 'Server error while retrieving student data' });
        }

        if (studentData.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = studentData[0];

        db.query(insertStudentQuery, [student.Student_Name, student.Student_Email, student.Student_Age, student.Student_Phone, student.Student_Gender, student.Student_Department], (err, result) => {
            if (err) {
                console.error('Error inserting into students_table:', err);
                return res.status(500).json({ message: 'Server error while saving student data' });
            }

            db.query(insertLoginQuery, [student.Student_Name, student.Student_Email, student.Student_Password], (err, result) => {
                if (err) {
                    console.error('Error inserting into login_table:', err);
                    return res.status(500).json({ message: 'Server error while saving login details' });
                }

                // Send approval email
                const emailText = `Dear ${student.Student_Name},\n\nYour request has been approved and your data has been saved.\nPlease remember that your password to login is : ${student.Student_Password} \nPlease log in using the provided credentials.\n\nBest regards,\nOur Team`;
                sendEmail(student.Student_Email, 'Request Approved', emailText)
                    .then(() => {
                        return res.status(200).json({ message: 'Student approved and data saved successfully!' });
                    })
                    .catch(emailErr => {
                        console.error('Error sending approval email:', emailErr);
                        return res.status(200).json({ message: 'Student approved, but there was an issue sending the email.' });
                    });

                db.query(deleteRequestQuery, [studentSno], (err, result) => {
                    if (err) {
                        console.error('Error deleting request:', err);
                        return res.status(500).json({ message: 'Server error while deleting request' });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Request not found' });
                    }

                });
            });
        });
    });
});


// canceling request from registration and sending email to student regarding cancelation
app.delete('/cancelrequest/:studentSno', (req, res) => {
    const studentSno = req.params.studentSno;

    // First, retrieve the student data to get the email address
    const getRequestQuery = `SELECT Student_Email FROM student_registration_request_table WHERE S_no = ?`;

    db.query(getRequestQuery, [studentSno], (err, result) => {
        if (err) {
            console.error('Error retrieving request data:', err);
            return res.status(500).json({ message: 'Server error while retrieving request data' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const studentEmail = result[0].Student_Email; // Get the student's email

        // Now, delete the request from the database
        const deleteRequestQuery = `DELETE FROM student_registration_request_table WHERE S_no = ?`;

        db.query(deleteRequestQuery, [studentSno], (err, result) => {
            if (err) {
                console.error('Error deleting request:', err);
                return res.status(500).json({ message: 'Server error while deleting request' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Request not found' });
            }

            // Send cancellation email
            const emailText = `Dear student,\n\nYour request has been canceled.\n Try again filling proper data.\n\nBest regards,\nOur Team`;
            sendEmail(studentEmail, 'Request Canceled', emailText)
                .then(() => {
                    return res.status(200).json({ message: 'Request canceled successfully!' });
                })
                .catch(emailErr => {
                    console.error('Error sending cancellation email:', emailErr);
                    return res.status(200).json({ message: 'Request canceled, but there was an issue sending the email.' });
                });
        });
    });
});


// students page funtions-------------------------------------------------------------------------------------------------------------------------------------------
// featching details of all the teachers from database to show 
app.get('/teachers', (req, res) => {
    const getTeachersQuery = 'SELECT * FROM teacher_table'; // querry to get all teachers details from databse

    db.query(getTeachersQuery, (err, result) => {
        if (err) {
            console.error('Error retrieving teachers:', err);
            return res.status(500).json({ message: 'Server error while retrieving teachers' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No teachers found' });
        }

        res.status(200).json(result); // Send the result as JSON
    });
});


// adding data to appointment table 
app.post('/bookappointment', (req, res) => {
    const { teacherName, department, studentName, studentEmail, studentPhone, studentSubject, appointmentDate, studentMessage } = req.body;

    const searchTeacherQuerry = `
        SELECT * FROM teacher_table 
        WHERE Teacher_Name LIKE ? 
        AND Teacher_Department LIKE ?
    `;
    const bookAppointmentQuery = `
        INSERT INTO appointment_table (Teacher_Name, Teacher_Department, Student_Name, Student_Email, Student_Phone, Student_Subject,Date_of_Appointment, Appointment_Details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(searchTeacherQuerry, [`%${teacherName}%`, `%${department}%`], (err, results) => {
        if (err) {
            console.error('Error searching for teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            db.query(bookAppointmentQuery, [teacherName, department, studentName, studentEmail, studentPhone, studentSubject, appointmentDate, studentMessage], (err, result) => {
                if (err) {
                    console.error('Error booking appointment:', err);
                    return res.status(500).json({ message: 'Server error while booking appointment' });
                }

                res.status(200).json({ message: 'Appointment booked successfully' });
            });

        } else {
            res.status(404).json({ message: 'No teachers found matching your search criteria.' });
        }
    });
});


// adding data to appointment table 
app.post('/sendmessage', (req, res) => {
    const { teacherName, department, studentName, studentEmail, studentPhone, studentMessage } = req.body;

    const searchTeacherQuerry = `
        SELECT * FROM teacher_table 
        WHERE Teacher_Name LIKE ? 
        AND Teacher_Department LIKE ?
    `;
    const sendMessageQuerry = ` 
        INSERT INTO student_message_table (Teacher_Name, Teacher_Department, Student_Name, Student_Email, Student_Phone, Student_Message)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(searchTeacherQuerry, [`%${teacherName}%`, `%${department}%`], (err, results) => {
        if (err) {
            console.error('Error searching for teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            db.query(sendMessageQuerry, [teacherName, department, studentName, studentEmail, studentPhone, studentMessage], (err, result) => {
                if (err) {
                    console.error('Error booking appointment:', err);
                    return res.status(500).json({ message: 'Server error while send message' });
                }

                res.status(200).json({ message: 'Message sent successfully' });
            });

        } else {
            res.status(404).json({ message: 'No teachers found matching your search criteria.' });
        }
    });

});


// teacher account page functions ------------------------------------------------------------------------------------------------------------------------------------
// Fetching teacher department by teacher name and email
app.get('/teacher/department', (req, res) => {
    const { name, email } = req.query;

    // console.log("Received name:", name);
    // console.log("Received email:", email);

    const query = 'SELECT Teacher_Department FROM teacher_table WHERE Teacher_Name = ? AND Teacher_Email = ?';

    db.query(query, [name, email], (err, result) => {
        if (err) {
            console.error('Error retrieving department:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.status(200).json({ department: result[0].Teacher_Department });
    });
});


// fetching all messages for teacher who is loged in
app.get('/messages', (req, res) => {
    const { name, department } = req.query;

    const query = 'SELECT * FROM student_message_table WHERE Teacher_Name = ? AND Teacher_Department = ?';

    db.query(query, [name, department], (err, result) => {
        if (err) {
            console.error('Error retrieving messages:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No messages found' });
        }

        res.status(200).json({ messages: result });
    });
});


// deleting message of given index 
app.delete('/messages/:Sno', (req, res) => {
    const { Sno } = req.params;

    const deleteQuery = 'DELETE FROM student_message_table WHERE S_no = ?';
    db.query(deleteQuery, [Sno], (err, result) => {
        if (err) {
            console.error('Error deleting message:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    });
});


// fetching all appointments for teacher who is loged in
app.get('/appointments', (req, res) => {
    const { name, department } = req.query;

    const query = 'SELECT * FROM appointment_table WHERE Teacher_Name = ? AND Teacher_Department = ?';

    db.query(query, [name, department], (err, result) => {
        if (err) {
            console.error('Error retrieving appointments:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No appointments found' });
        }

        res.status(200).json({ messages: result });
    });
});


// cancelling appointment and sending email regarding cancellation to student
app.delete('/cancelappointment/:Sno/:email/:ression', (req, res) => {
    const { Sno } = req.params;
    const { email } = req.params;
    const { ression } = req.params;

    const deleteQuery = 'DELETE FROM appointment_table WHERE S_no = ?';
    db.query(deleteQuery, [Sno], (err, result) => {
        if (err) {
            console.error('Error deleting message:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Message deleted successfully' });
        // sending email to student regardig cancellation 
        const emailText = `Dear student,\n\nYour appointment has been canceled.\nThis is the ression Teacher give for Cancelling you appointment \n"${ression}" \nTry again concedering the ression.\n\nBest regards,\nOur Team`;
        sendEmail(email, 'Appointment Canceled', emailText)
            .then(() => {
                return res.status(200).json({ message: 'Appointment canceled successfully!' });
            })
            .catch(emailErr => {
                console.error('Error sending cancellation email:', emailErr);
                return res.status(200).json({ message: 'Appointment canceled, but there was an issue sending the email.' });
            });

    });
});


// scheduling appointment and sending email regarding appointment and deleting it from database
app.get('/appointmentdetails/:Sno', (req, res) => {
    const { Sno } = req.params;

    const query = 'SELECT * FROM appointment_table WHERE S_no = ?';

    db.query(query, [Sno], (err, result) => {
        if (err) {
            console.error('Error fetching appointment details:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.status(200).json(result[0]);
    });
});


app.post('/schedule-appointment', async (req, res) => {
    const {
        appointmentId,
        teacherName,
        teacherDepartment,
        studentName,
        studentEmail,
        studentPhone,
        studentSubject,
        dateOfAppointment,
        teacherContact: teacherContact
    } = req.body;

    // const getAppointmentQuery = 'SELECT * FROM appointment_table WHERE S_no = ?';
    const saveAppointmentQuery = `
        INSERT INTO scheduled_appointment_table ( Teacher_Name, Teacher_Department, Student_Name, Student_Email, Student_Phone, Student_Subject, Date_of_Appointment)
        VALUES (?, ?, ?, ?, ?, ?,? )
    `;
    const deleteAppointmentQuery = 'DELETE FROM appointment_table WHERE S_no = ?';

    try {
        // Save appointment details to scheduled_appointment_table
        db.query(saveAppointmentQuery, [teacherName, teacherDepartment, studentName, studentEmail, studentPhone, studentSubject, dateOfAppointment], (err, result) => {
            if (err) {
                console.error('Error saving appointment:', err);
                return res.status(500).json({ message: 'Error saving appointment' });
            }


            // Delete appointment from appointment_table
            db.query(deleteAppointmentQuery, [appointmentId], (err, result) => {
                if (err) {
                    console.error('Error deleting appointment:', err);
                    return res.status(500).json({ message: 'Error deleting appointment' });
                }

                res.status(200).json({ message: 'Appointment scheduled and removed from appointment table successfully' });

                // sending email to student regarding the appointment schedule 
                const emailText = `Dear student,\n\nYour appointment has been scheduled on asked date - ${dateOfAppointment} .\nYou can contact to ${teacherName} sir/mam on this contact no. - ${teacherContact} for further details\n\n\nBest regards,\nOur Team`;
                sendEmail(studentEmail, 'Appointment scheduled', emailText)
                    .then(() => {
                        return res.status(200).json({ message: 'Appointment scheduled successfully!' });
                    })
                    .catch(emailErr => {
                        console.error('Error sending cancellation email:', emailErr);
                        return res.status(200).json({ message: 'Appointment scheduled, but there was an issue sending the email.' });
                    });
            });
        });
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// showing scheduled appointments 
app.get('/scheduledappointments', (req, res) => {
    const { name, department } = req.query;

    const query = 'SELECT * FROM scheduled_appointment_table WHERE Teacher_Name = ? AND Teacher_Department = ?';

    db.query(query, [name, department], (err, result) => {
        if (err) {
            console.error('Error retrieving scheduled appointments:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'No scheduled appointments found' });
        }

        res.status(200).json({ messages: result });
    });
});


// delete perticular scheduled appointment 
app.delete('/scheduledappointments/:Sno', (req, res) => {
    const { Sno } = req.params;

    const deleteQuery = 'DELETE FROM scheduled_appointment_table WHERE S_no = ?';
    db.query(deleteQuery, [Sno], (err, result) => {
        if (err) {
            console.error('Error deleting scheduled appointment:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'scheduled appointment not found' });
        }

        res.status(200).json({ message: 'scheduled appointment deleted successfully' });
    });
});


// port listening msg -------------------------------------------------------------------------------------------------------------------------------------------------
// listening server 
app.listen(8081, () => {
    console.log("Server is listening on port 8081");
});
