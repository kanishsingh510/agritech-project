## AgriTech: Farmer & Buyer Product Management System

Full‑stack agritech platform built with Node.js, Express.js, MongoDB, EJS, Tailwind CSS, and Razorpay (test mode).

### Features
- Authentication with roles: Farmer, Buyer (bcrypt + express-session)
- Role redirects: Farmer → `/farmer/dashboard`, Buyer → `/buyer/marketplace`
- Farmer dashboard: add/edit/delete products with image upload (Multer)
- Buyer marketplace: view products, filter by category, search by name
- Razorpay test payments: order creation + verification; transactions saved to DB
- Multi-language (English/Hindi) toggle on Farmer dashboard via `/public/js/language.js`
- Responsive UI with Tailwind CSS (CDN)

### Tech Stack
- Node.js, Express.js, EJS
- MongoDB, Mongoose
- express-session, connect-mongo
- Multer (image uploads to `public/uploads`)
- Razorpay (test keys)

---

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file in the project root with:
```
PORT=5000
SESSION_SECRET=agri-tech-secret
RAZORPAY_KEY_ID=rzp_test_12345
RAZORPAY_SECRET=abc123
# Optional: if local MongoDB isn’t running, server will try Atlas via ATLAS_URI
ATLAS_URI=
```

Notes:
- The app connects to local MongoDB at `mongodb://127.0.0.1:27017/agritech` by default (see `config/db.js`). If local is unavailable, it will try `ATLAS_URI`.
- On Windows PowerShell, you can set env vars for the session instead:
```powershell
$env:PORT="5000"
$env:SESSION_SECRET="agri-tech-secret"
$env:RAZORPAY_KEY_ID="rzp_test_12345"
$env:RAZORPAY_SECRET="abc123"
$env:ATLAS_URI=""
```

### 3) Start MongoDB
- Local MongoDB recommended: install and run mongod.

### 4) Seed demo users and products
Start the server (next step) and visit: `http://localhost:5000/seed`

Seeds created:
- Farmer: `farmer@gmail.com` / `123456`
- Buyer: `buyer@gmail.com` / `123456`
- Products: Mango, Onion, Rice, Milk, Ghee, Wheat, Tomato

### 5) Run the server
```bash
npm start
```

Open `http://localhost:5000`

---

## Usage

### Authentication
- Single login page with role selector (Farmer/Buyer)
- Redirects by role after login

### Farmer Dashboard (`/farmer/dashboard`)
- Create products with fields: Name, Category, Price (₹), Quantity, Description, Image
- Categories: Fruits, Vegetables, Dairy, Grains, Spices, Organic
- Language toggle (English 🇬🇧 / हिंदी 🇮🇳) stored in localStorage

### Buyer Marketplace (`/buyer/marketplace`)
- View all products; filter by category; search by name
- Shows farmer name and location
- Buy Now → Razorpay popup → on success, transaction saved

### Buyer Dashboard (`/buyer/dashboard`)
- View payment confirmations and past transactions

---

## Project Structure
```
AgriTech/
├── server.js
├── config/db.js
├── routes/
│   ├── auth.js
│   ├── farmer.js
│   ├── buyer.js
│   └── payment.js
├── controllers/
│   ├── authController.js
│   ├── farmerController.js
│   ├── buyerController.js
│   └── paymentController.js
├── models/
│   ├── User.js
│   ├── product.js
│   └── Transaction.js
├── views/
│   ├── home.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   ├── farmer/dashboard.ejs
│   ├── buyer/marketplace.ejs
│   └── buyer/dashboard.ejs
├── public/
│   ├── css/style.css
│   ├── js/language.js
│   └── uploads/ (created at runtime)
└── .env (not committed)
```

---

## Key Endpoints
- `GET /` → Home
- `GET /login`, `POST /login`, `POST /logout`
- `GET /signup`, `POST /signup`
- `GET /seed` → seed demo users/products
- `GET /farmer/dashboard`, `POST /farmer/products`, `PUT /farmer/products/:id`, `DELETE /farmer/products/:id`
- `GET /buyer/marketplace`, `GET /buyer/dashboard`
- `POST /payment/create-order`, `POST /payment/verify`

---

## Notes
- Image uploads are stored under `public/uploads` and served statically.
- Razorpay runs in test mode using the provided test keys.
- Tailwind CSS is included via CDN with primary color `#3CB043`.

License: MIT

