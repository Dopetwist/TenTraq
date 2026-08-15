# 🏠 TenTraq

A modern and responsive tenants management web application built to simplify property and tenants management for landlords, property managers, and real estate businesses.

The platform allows users to manage tenants, rental properties, payments, and tenant records from a centralized dashboard with an intuitive user experience.

---

# 🚀 Features

## 👥 Tenant Management

* Add, edit, and delete tenant records
* Store tenant contact information and rental details
* Track tenant occupancy status
* Manage tenant profiles efficiently

## 🏢 Property Management

* Manage multiple rental properties
* Add property details such as address, rent amount, and unit type
* Monitor property availability and occupancy

## 💳 Rent & Payment Tracking

* Track rent payments and payment history
* Monitor unpaid or overdue rents
* Maintain organized financial records

## 📱 Responsive Design

* Fully responsive across desktop, tablet, and mobile devices
* Clean and user-friendly interface

---

# 🧰 Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* React.js
* Axios

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

---

# 📂 Project Structure

```bash
Tenants-Web-App/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   ├── index.js
│
│
├── package.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Dopetwist/TenTrackr.git
```

## 2️⃣ Navigate Into the Project Directory

```bash
cd TenTrackr
```

## 3️⃣ Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the server folder and add the following:

```env
PORT=5000
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
SESSION_SECRET=your_secret_key
```

---

# ▶️ Running the Application

## Start the Backend Server

```bash
cd server
nodemon index.js
```

## Start the Frontend Development Server

```bash
cd client
npm run dev
```

---

# 🌟 Future Improvements

* Secure user authentication system
* Login and registration functionality
* Protected routes and session handling
* Email notifications for rent reminders
* Advanced analytics dashboard

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

To contribute:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

# 👨‍💻 Author

Built with passion by Jonathan Afugwobi.

If you found this project helpful, feel free to give it a ⭐.
