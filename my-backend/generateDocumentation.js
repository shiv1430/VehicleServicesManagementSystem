const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  margin: 50,
  size: 'A4'
});

const output = fs.createWriteStream(path.join(__dirname, 'Vehicle_Management_Backend_Documentation.pdf'));
doc.pipe(output);

// Helper functions
function heading1(text) {
  doc.fontSize(24).font('Helvetica-Bold').text(text, { underline: true });
  doc.moveDown(0.5);
}

function heading2(text) {
  doc.fontSize(16).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function heading3(text) {
  doc.fontSize(12).font('Helvetica-Bold').text(text);
  doc.moveDown(0.2);
}

function normalText(text, size = 10) {
  doc.fontSize(size).font('Helvetica').text(text, { align: 'left' });
  doc.moveDown(0.2);
}

function codeBlock(text) {
  doc.fontSize(8).font('Courier').text(text, { align: 'left' });
  doc.moveDown(0.1);
}

function table(rows, columnWidths = null) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = rows[0].length;
  
  if (!columnWidths) {
    columnWidths = Array(cols).fill(pageWidth / cols);
  }

  let startX = doc.x;
  let startY = doc.y;
  
  rows.forEach((row, rowIdx) => {
    let cellX = startX;
    row.forEach((cell, cellIdx) => {
      const cellWidth = columnWidths[cellIdx];
      const cellHeight = 25;
      
      // Background for header row
      if (rowIdx === 0) {
        doc.rect(cellX, startY, cellWidth, cellHeight).fill('#E0E0E0');
        doc.fillColor('#000000');
        doc.fontSize(9).font('Helvetica-Bold');
      } else {
        doc.rect(cellX, startY, cellWidth, cellHeight).stroke();
        doc.fontSize(8).font('Helvetica');
      }
      
      doc.text(cell, cellX + 5, startY + 5, { width: cellWidth - 10, height: cellHeight - 10 });
      cellX += cellWidth;
    });
    startY += (rowIdx === 0 ? 25 : 25);
  });
  
  doc.moveDown(rows.length * 0.8);
}

// START OF DOCUMENTATION
doc.fontSize(28).font('Helvetica-Bold').text('Vehicle Management Backend', { align: 'center' });
doc.fontSize(18).font('Helvetica').text('Complete Documentation', { align: 'center' });
doc.moveDown(1);
normalText('A Beginner-Friendly Guide for Node.js + Express + MongoDB Backend Development', 10);
doc.moveDown(1);
normalText(`Document Created: ${new Date().toLocaleDateString()}`, 9);

doc.addPage();

// ==========================================
// 1. PROJECT INTRODUCTION
// ==========================================
heading1('1. PROJECT INTRODUCTION');

normalText('What This Backend Does');
doc.moveDown(0.2);
normalText('This backend is a Smart Vehicle Service Platform that helps customers book vehicle service appointments at garages. Customers can:');
normalText('• Register and login with an account');
normalText('• Add and manage their vehicles');
normalText('• Discover nearby garages and their services');
normalText('• Book appointments at garages');
normalText('• Communicate with mechanics via chat');
normalText('• Write reviews for completed services');
normalText('• View invoices and payment status');
doc.moveDown(0.3);

normalText('Garage owners can:');
normalText('• Create and manage their garages');
normalText('• Add mechanics to their team');
normalText('• Manage service offerings and pricing');
normalText('• Accept and update bookings');
doc.moveDown(0.5);

heading3('What is Vehicle Management?');
normalText('Vehicle Management means organizing and handling vehicle-related services. In this system, it includes:');
normalText('• Storing customer vehicle information (brand, model, number)');
normalText('• Managing which user owns which vehicle');
normalText('• Booking service appointments for vehicles');
normalText('• Tracking service history through invoices');
doc.moveDown(0.5);

heading3('Technologies Used');
normalText('1. Node.js - JavaScript runtime that allows JavaScript to run on servers');
normalText('2. Express - Web framework that makes creating APIs easy');
normalText('3. MongoDB - NoSQL database that stores data as JSON documents');
normalText('4. Mongoose - Library that helps us work with MongoDB in Node.js');
normalText('5. bcrypt - Security library for encrypting passwords');
normalText('6. JWT (JSON Web Token) - Used for secure authentication and session management');
doc.moveDown(0.5);

heading3('Why Each Technology?');
normalText('• Node.js: Allows JavaScript on servers. Easy to learn and very fast.');
normalText('• Express: Simplifies handling HTTP requests/responses. Makes routing easy.');
normalText('• MongoDB: Flexible database that stores data in JSON format (documents). No need to define fixed table structures.');
normalText('• Mongoose: Makes it easier to define data structure (schemas) and validate data.');
normalText('• bcrypt: Hashes passwords so they cannot be read even if database is hacked.');
normalText('• JWT: Creates tokens that prove a user is logged in without storing session on server.');

doc.addPage();

// ==========================================
// 2. PROJECT STRUCTURE
// ==========================================
heading1('2. PROJECT STRUCTURE');

normalText('The actual project folder structure:');
doc.moveDown(0.3);

codeBlock('my-backend/');
codeBlock('│');
codeBlock('├── server.js                    (Main server file - starts everything)');
codeBlock('├── package.json                 (Project dependencies)');
codeBlock('├── dropDatabase.js              (Script to drop MongoDB database)');
codeBlock('│');
codeBlock('├── config/');
codeBlock('│   └── db.js                    (MongoDB connection setup)');
codeBlock('│');
codeBlock('├── models/                      (Data structure definitions)');
codeBlock('│   ├── User.js                  (User schema - customers, mechanics, owners)');
codeBlock('│   ├── Vehicle.js               (Vehicle schema - cars owned by customers)');
codeBlock('│   ├── Booking.js               (Booking schema - appointments)');
codeBlock('│   ├── Garage.js                (Garage schema - service centers)');
codeBlock('│   ├── Invoice.js               (Invoice schema - billing)');
codeBlock('│   ├── Review.js                (Review schema - customer feedback)');
codeBlock('│   ├── Message.js               (Message schema - chat between users)');
codeBlock('│   └── Notification.js          (Notification schema - user alerts)');
codeBlock('│');
codeBlock('├── controllers/                 (Business logic - handles requests)');
codeBlock('│   ├── userController.js        (User login, register, CRUD)');
codeBlock('│   ├── vehicleController.js     (Vehicle CRUD operations)');
codeBlock('│   ├── bookingController.js     (Booking CRUD operations)');
codeBlock('│   ├── garageController.js      (Garage CRUD operations)');
codeBlock('│   └── platformController.js    (Reviews, messages, notifications)');
codeBlock('│');
codeBlock('├── routes/                      (API endpoints - what URLs exist)');
codeBlock('│   ├── userRoutes.js            (Register, login, get users)');
codeBlock('│   ├── vehicleRoutes.js         (Vehicle endpoints)');
codeBlock('│   ├── bookingRoutes.js         (Booking endpoints)');
codeBlock('│   ├── garageRoutes.js          (Garage endpoints)');
codeBlock('│   └── platformRoutes.js        (Review, chat, notification endpoints)');
codeBlock('│');
codeBlock('└── middleware/');
codeBlock('    └── auth.js                  (Authentication & authorization checks)');

doc.moveDown(0.3);

heading3('What Each Folder Does:');

heading3('models/');
normalText('Contains Mongoose schemas - these define what data each collection stores and what data types are required. Think of models as the blueprint for data.');

heading3('controllers/');
normalText('Contains the business logic - the actual code that handles API requests. Controllers talk to models to read/write data from MongoDB.');

heading3('routes/');
normalText('Maps URLs to controllers. When someone makes a request to /users/register, the routes tell Express which controller function to run.');

heading3('config/');
normalText('Contains configuration files, like database connection settings.');

heading3('middleware/');
normalText('Contains middleware - code that runs before reaching the controller. auth.js checks if user is logged in.');

doc.addPage();

// ==========================================
// 3. SERVER.JS EXPLANATION
// ==========================================
heading1('3. SERVER.JS EXPLANATION');

normalText('What does server.js do?');
doc.moveDown(0.2);
normalText('server.js is the entry point - it starts the entire backend. Here is the flow:');

doc.moveDown(0.3);
normalText('1. Load environment variables from .env file');
normalText('2. Import Express framework');
normalText('3. Import database connection function');
normalText('4. Import all route files');
normalText('5. Create Express app');
normalText('6. Add middleware (express.json())');
normalText('7. Register all routes');
normalText('8. Connect to MongoDB');
normalText('9. Start listening on a port (usually 3000)');

doc.moveDown(0.3);
heading3('The Backend Flow:');

normalText('Postman (or browser)');
normalText('           ↓');
normalText('   HTTP Request to /users/register');
normalText('           ↓');
normalText('     Express Routes');
normalText('           ↓');
normalText('  userController.registerUser()');
normalText('           ↓');
normalText('   User.js (Mongoose Model)');
normalText('           ↓');
normalText('      MongoDB Database');
normalText('           ↓');
normalText('   HTTP Response (JSON)');

doc.moveDown(0.3);
heading3('What happens in server.js:');
normalText('• app.use(express.json()) - tells Express to accept JSON data from requests');
normalText('• app.use("/users", userRoutes) - all URLs starting with /users use userRoutes');
normalText('• connectDB() - connects to MongoDB server');
normalText('• app.listen(3000, ...) - server listens on port 3000 for incoming requests');

doc.addPage();

// ==========================================
// 4. DATABASE EXPLANATION
// ==========================================
heading1('4. DATABASE EXPLANATION');

heading3('What is MongoDB?');
normalText('MongoDB is a database (like Excel for programmers). It stores data in collections (like sheets). Each row of data is called a document (like JSON).');

heading3('What is Mongoose?');
normalText('Mongoose is a library that helps us work with MongoDB. It lets us:');
normalText('• Define schemas (structure of data)');
normalText('• Validate data (check if required fields exist)');
normalText('• Query data (find, update, delete)');
normalText('• Create relationships between data');

heading3('What is a Schema?');
normalText('A schema is the blueprint. It says: "A User has a name (String), email (String), password (String)"');

heading3('What is a Collection?');
normalText('A collection is like a table. It contains many documents. MongoDB database "vehicleManagement" has 8 collections.');

heading3('Collections in vehicleManagement database:');
normalText('1. users - stores all user accounts');
normalText('2. vehicles - stores customer vehicles');
normalText('3. bookings - stores service appointments');
normalText('4. garages - stores garage/service center information');
normalText('5. invoices - stores billing information');
normalText('6. reviews - stores customer reviews');
normalText('7. messages - stores chat messages');
normalText('8. notifications - stores user notifications');

doc.moveDown(0.3);
heading3('How Data Reaches MongoDB:');

normalText('Step 1: User sends request via Postman');
codeBlock('POST http://localhost:3000/users/register');
codeBlock('Body: { "name": "John", "email": "john@test.com", "password": "12345678" }');

normalText('Step 2: Express receives request, routes to userController');

normalText('Step 3: userController.registerUser() function runs');
codeBlock('const newUser = new User({ name, email, password: hashedPassword });');
codeBlock('await newUser.save();');

normalText('Step 4: Mongoose connects to MongoDB');

normalText('Step 5: MongoDB stores document in users collection');

normalText('Step 6: Response sent back to Postman with user ID and JWT token');

doc.moveDown(0.3);
heading3('Database Connection:');
normalText('Connection string: mongodb://127.0.0.1:27017/vehicleManagement');
normalText('• 127.0.0.1 = localhost (your computer)');
normalText('• 27017 = default MongoDB port');
normalText('• vehicleManagement = database name');

doc.addPage();

// ==========================================
// 5. DATA MODELS
// ==========================================
heading1('5. DATA MODELS (SCHEMAS)');

heading2('Model 1: User');
normalText('Collection: users');
normalText('Purpose: Stores all user accounts (customers, mechanics, garage owners)');
doc.moveDown(0.2);

const userFields = [
  ['Field', 'Type', 'Required', 'Purpose'],
  ['name', 'String', 'Yes', 'User full name'],
  ['email', 'String', 'Yes (Unique)', 'User email - must be unique'],
  ['mobile', 'String', 'Yes', 'User phone number'],
  ['role', 'String', 'No', 'Role: customer, garage_owner, mechanic, admin'],
  ['password', 'String', 'Yes', 'Encrypted password using bcrypt'],
  ['timestamps', 'Date', 'Auto', 'createdAt and updatedAt']
];
table(userFields, [80, 80, 100, 200]);

doc.moveDown(0.3);
heading2('Model 2: Vehicle');
normalText('Collection: vehicles');
normalText('Purpose: Stores vehicles owned by customers');
doc.moveDown(0.2);

const vehicleFields = [
  ['Field', 'Type', 'Required', 'Purpose'],
  ['owner', 'ObjectId', 'Yes', 'Reference to User (vehicle owner)'],
  ['vehicleNumber', 'String', 'Yes', 'License plate number (e.g., MH12ABC1234)'],
  ['brand', 'String', 'Yes', 'Car brand (e.g., Toyota, Honda)'],
  ['model', 'String', 'Yes', 'Car model (e.g., Innova, Accord)'],
  ['fuelType', 'String', 'Yes', 'Petrol, Diesel, CNG, Electric'],
  ['manufacturingYear', 'Number', 'Yes', 'Year car was made (e.g., 2020)']
];
table(vehicleFields, [80, 80, 100, 200]);

doc.moveDown(0.3);
normalText('Relationship: Each Vehicle has ONE owner (User). One User can own MANY vehicles.');

doc.addPage();

heading2('Model 3: Booking');
normalText('Collection: bookings');
normalText('Purpose: Stores service appointment bookings');
doc.moveDown(0.2);

const bookingFields = [
  ['Field', 'Type', 'Purpose'],
  ['customer', 'ObjectId', 'Reference to User (who booked)'],
  ['vehicle', 'ObjectId', 'Reference to Vehicle (which car)'],
  ['garage', 'ObjectId', 'Reference to Garage (where booked)'],
  ['mechanic', 'ObjectId', 'Reference to User (assigned mechanic)'],
  ['service', 'Object', '{ name: String, price: Number }'],
  ['appointmentAt', 'Date', 'When appointment is scheduled'],
  ['status', 'String', 'pending, confirmed, in-progress, completed'],
  ['notes', 'String', 'Additional notes about booking'],
  ['completedAt', 'Date', 'When service was completed']
];
table(bookingFields, [100, 100, 280]);

doc.moveDown(0.3);
normalText('Relationships:');
normalText('• Booking → Customer (User) → Can have many bookings');
normalText('• Booking → Vehicle → Each booking is for one vehicle');
normalText('• Booking → Garage → Each booking is at one garage');
normalText('• Booking → Mechanic (User) → Assigned mechanic handles booking');

doc.addPage();

heading2('Model 4: Garage');
normalText('Collection: garages');
normalText('Purpose: Stores garage/service center information');
doc.moveDown(0.2);

const garageFields = [
  ['Field', 'Type', 'Purpose'],
  ['owner', 'ObjectId', 'Reference to User (garage owner)'],
  ['name', 'String', 'Garage name (e.g., "ABC Car Service")'],
  ['address', 'String', 'Full address of garage'],
  ['phone', 'String', 'Garage contact number'],
  ['description', 'String', 'Details about garage services'],
  ['services', 'Array', 'List of services with { name, description, price }'],
  ['mechanics', 'Array', 'List of mechanic User IDs working in garage'],
  ['rating', 'Number', 'Average rating (0-5)'],
  ['verified', 'Boolean', 'Is garage verified by platform']
];
table(garageFields, [100, 100, 280]);

doc.moveDown(0.3);

heading2('Model 5: Invoice');
normalText('Collection: invoices');
normalText('Purpose: Stores billing information for completed bookings');
doc.moveDown(0.2);

const invoiceFields = [
  ['Field', 'Type', 'Purpose'],
  ['booking', 'ObjectId', 'Reference to Booking'],
  ['customer', 'ObjectId', 'Reference to User (customer)'],
  ['garage', 'ObjectId', 'Reference to Garage'],
  ['mechanic', 'ObjectId', 'Reference to User (mechanic)'],
  ['vehicle', 'ObjectId', 'Reference to Vehicle'],
  ['serviceCharges', 'Number', 'Cost of service'],
  ['sparePartsCost', 'Number', 'Cost of spare parts used'],
  ['tax', 'Number', 'Tax amount'],
  ['total', 'Number', 'serviceCharges + sparePartsCost + tax'],
  ['paymentStatus', 'String', 'pending or paid']
];
table(invoiceFields, [100, 100, 280]);

doc.addPage();

heading2('Model 6: Review');
normalText('Collection: reviews');
normalText('Purpose: Customer reviews for completed services');
doc.moveDown(0.2);

const reviewFields = [
  ['Field', 'Type', 'Purpose'],
  ['booking', 'ObjectId', 'Reference to Booking being reviewed'],
  ['customer', 'ObjectId', 'Reference to User (who wrote review)'],
  ['garage', 'ObjectId', 'Reference to Garage (being reviewed)'],
  ['rating', 'Number', 'Rating from 1 to 5 stars'],
  ['comment', 'String', 'Written review text']
];
table(reviewFields, [100, 100, 280]);

doc.moveDown(0.3);

heading2('Model 7: Message');
normalText('Collection: messages');
normalText('Purpose: Chat messages between customer and mechanic for a booking');
doc.moveDown(0.2);

const messageFields = [
  ['Field', 'Type', 'Purpose'],
  ['booking', 'ObjectId', 'Reference to Booking (which appointment)'],
  ['sender', 'ObjectId', 'Reference to User (who sent message)'],
  ['recipient', 'ObjectId', 'Reference to User (who receives message)'],
  ['text', 'String', 'Message text content'],
  ['imageUrl', 'String', 'URL to image (optional)']
];
table(messageFields, [100, 100, 280]);

doc.moveDown(0.3);

heading2('Model 8: Notification');
normalText('Collection: notifications');
normalText('Purpose: Alerts sent to users (booking updates, reviews, etc)');
doc.moveDown(0.2);

const notificationFields = [
  ['Field', 'Type', 'Purpose'],
  ['recipient', 'ObjectId', 'Reference to User (who receives notification)'],
  ['type', 'String', 'Type of notification (booking_update, review, message)'],
  ['message', 'String', 'Notification message text'],
  ['read', 'Boolean', 'Has user read this notification'],
  ['booking', 'ObjectId', 'Reference to related Booking (optional)']
];
table(notificationFields, [100, 100, 280]);

doc.addPage();

// ==========================================
// 6. CONTROLLERS EXPLANATION
// ==========================================
heading1('6. CONTROLLERS & BUSINESS LOGIC');

normalText('Controllers contain the actual logic that handles API requests. Each controller has functions for CRUD operations:');
normalText('• C = CREATE - Add new data');
normalText('• R = READ - Get data');
normalText('• U = UPDATE - Modify data');
normalText('• D = DELETE - Remove data');

doc.moveDown(0.3);

heading2('UserController');
normalText('File: controllers/userController.js');
normalText('Functions:');
normalText('• registerUser() - Creates new user account with hashed password');
normalText('• loginUser() - Verifies email/password and returns JWT token');
normalText('• getUsers() - Gets all users (admin only)');
normalText('• updateUser() - Updates user profile');
normalText('• deleteUser() - Deletes user account (admin only)');

doc.moveDown(0.3);

heading2('VehicleController');
normalText('File: controllers/vehicleController.js');
normalText('Functions:');
normalText('• listVehicles() - Get all vehicles of logged-in customer');
normalText('• addVehicle() - Customer adds a new vehicle');
normalText('• updateVehicle() - Customer updates vehicle details');
normalText('• deleteVehicle() - Customer deletes a vehicle');
normalText('Note: Only customers can manage vehicles. Each vehicle is tied to vehicle owner.');

doc.moveDown(0.3);

heading2('BookingController');
normalText('File: controllers/bookingController.js');
normalText('Functions:');
normalText('• listBookings() - Get bookings (filters by user role)');
normalText('  - Customers see their own bookings');
normalText('  - Garage owners see bookings for their garages');
normalText('  - Mechanics see bookings assigned to them');
normalText('• createBooking() - Customer creates appointment booking');
normalText('• updateBooking() - Update booking status or appointment time');

doc.addPage();

heading2('GarageController');
normalText('File: controllers/garageController.js');
normalText('Functions:');
normalText('• createGarage() - Garage owner creates a new garage');
normalText('• listOwnedGarages() - Get garages owned by logged-in user');
normalText('• updateGarage() - Garage owner updates garage details');
normalText('• addMechanic() - Garage owner adds a mechanic to their garage');
normalText('Note: Only garage owners can create/manage garages.');

doc.moveDown(0.3);

heading2('PlatformController');
normalText('File: controllers/platformController.js');
normalText('Functions:');
normalText('• discoverGarages() - Public: Search and discover garages');
normalText('• getGarage() - Public: Get details of one garage');
normalText('• createReview() - Logged-in customer reviews completed booking');
normalText('• listReviews() - Get reviews for a garage');
normalText('• updateReview() - Customer updates their review');
normalText('• deleteReview() - Customer deletes their review');
normalText('• listNotifications() - Get notifications for logged-in user');
normalText('• markNotificationRead() - Mark notification as read');
normalText('• listMessages() - Get chat messages for a booking');
normalText('• sendMessage() - Send chat message for a booking');
normalText('• listInvoices() - Customer gets their invoices');
normalText('• getInvoice() - Download invoice details');

doc.addPage();

// ==========================================
// 7. COMPLETE API REFERENCE
// ==========================================
heading1('7. COMPLETE API REFERENCE');
normalText('All endpoints in the backend. Authorization column shows who can access.');

doc.moveDown(0.3);
heading2('7.1 USER ENDPOINTS');

const userAPI = [
  ['Method', 'URL', 'Purpose', 'Auth', 'Body'],
  ['POST', '/users/register', 'Create new user', 'No', 'name, email, mobile, password'],
  ['POST', '/users/login', 'Login user', 'No', 'email, password'],
  ['GET', '/users', 'Get all users', 'Admin', 'none'],
  ['PUT', '/users/:id', 'Update user', 'Logged in', 'name, email, mobile'],
  ['DELETE', '/users/:id', 'Delete user', 'Admin', 'none']
];
table(userAPI, [60, 120, 120, 80, 110]);

doc.moveDown(0.3);
heading2('7.2 VEHICLE ENDPOINTS');
normalText('All vehicle endpoints require login with customer role');

const vehicleAPI = [
  ['Method', 'URL', 'Purpose', 'Body/Params'],
  ['GET', '/vehicles', 'List user vehicles', 'none'],
  ['POST', '/vehicles', 'Add new vehicle', 'vehicleNumber, brand, model, fuelType, manufacturingYear'],
  ['PUT', '/vehicles/:id', 'Update vehicle', 'any field to update'],
  ['DELETE', '/vehicles/:id', 'Delete vehicle', ':id = vehicle ID']
];
table(vehicleAPI, [70, 150, 150, 200]);

doc.moveDown(0.3);
heading2('7.3 BOOKING ENDPOINTS');
normalText('All booking endpoints require login');

const bookingAPI = [
  ['Method', 'URL', 'Purpose', 'Role'],
  ['GET', '/bookings', 'List bookings', 'customer/garage_owner/mechanic'],
  ['POST', '/bookings', 'Create booking', 'customer'],
  ['PATCH', '/bookings/:id', 'Update booking', 'customer/mechanic/garage_owner']
];
table(bookingAPI, [70, 150, 200, 150]);

doc.moveDown(0.3);
heading2('7.4 GARAGE ENDPOINTS');
normalText('All garage endpoints require login with garage_owner role');

const garageAPI = [
  ['Method', 'URL', 'Purpose', 'Body'],
  ['GET', '/garages/mine', 'List owned garages', 'none'],
  ['POST', '/garages', 'Create garage', 'name, address, phone, description, services'],
  ['PUT', '/garages/:id', 'Update garage', 'any field to update'],
  ['POST', '/garages/:id/mechanics', 'Add mechanic', 'mechanicId']
];
table(garageAPI, [70, 160, 150, 200]);

doc.addPage();

heading2('7.5 PLATFORM ENDPOINTS (PUBLIC & PRIVATE)');

const platformAPI = [
  ['Method', 'URL', 'Purpose', 'Auth', 'Body'],
  ['GET', '/api/garages', 'Search garages', 'No', 'query: service or search'],
  ['GET', '/api/garages/:id', 'Get garage details', 'No', 'none'],
  ['GET', '/api/garages/:id/reviews', 'Get garage reviews', 'No', 'none'],
  ['POST', '/api/reviews', 'Write review', 'Customer', 'booking, rating, comment'],
  ['PUT', '/api/reviews/:id', 'Update review', 'Customer', 'rating, comment'],
  ['DELETE', '/api/reviews/:id', 'Delete review', 'Customer', 'none'],
  ['GET', '/api/notifications', 'Get notifications', 'Login', 'none'],
  ['PATCH', '/api/notifications/:id/read', 'Mark as read', 'Login', 'none'],
  ['GET', '/api/chat/:bookingId', 'Get messages', 'Login', 'none'],
  ['POST', '/api/chat/:bookingId', 'Send message', 'Login', 'text, imageUrl'],
  ['GET', '/api/invoices', 'Get invoices', 'Customer', 'none'],
  ['GET', '/api/invoices/:id/download', 'Download invoice', 'Customer', 'none']
];
table(platformAPI, [60, 180, 150, 80, 150]);

doc.addPage();

// ==========================================
// 8. AUTHENTICATION & JWT
// ==========================================
heading1('8. AUTHENTICATION & JWT EXPLANATION');

heading3('What is Authentication?');
normalText('Authentication = Proving you are who you say you are. Usually with username/password.');

heading3('What is Authorization?');
normalText('Authorization = After proving who you are, what are you allowed to do?');
normalText('Example: A customer can only view their own vehicles, not other people\'s vehicles.');

heading3('Registration Flow:');
normalText('1. User sends: POST /users/register { name, email, password }');
normalText('2. Server checks if email already exists');
normalText('3. Server hashes password using bcrypt (converts "12345678" to "$2b$10$...")');
normalText('4. Server saves user to database');
normalText('5. Server creates JWT token');
normalText('6. Server returns token to client');
doc.moveDown(0.3);

heading3('What is JWT (JSON Web Token)?');
normalText('A JWT is a secure token that proves a user is logged in. It looks like:');
codeBlock('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI123...');
normalText('It contains:');
normalText('• Header - encryption method');
normalText('• Payload - user info (userId, role)');
normalText('• Signature - secret key that verifies token is real');

doc.moveDown(0.3);

heading3('Login Flow:');
normalText('1. User sends: POST /users/login { email, password }');
normalText('2. Server finds user by email in database');
normalText('3. Server uses bcrypt.compare() to check if password matches');
normalText('4. If password matches, server creates JWT token');
normalText('5. Server returns JWT token');
normalText('6. Client stores JWT (in localStorage, cookies, etc)');

doc.moveDown(0.3);

heading3('Using the Token in Requests:');
normalText('After login, client sends JWT in every request:');
normalText('• In Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
normalText('• Server verifies token using middleware (auth.js)');
normalText('• If token is valid, request proceeds');
normalText('• If token is invalid or expired, request is rejected (401 error)');

doc.moveDown(0.3);

heading3('Why JWT instead of Sessions?');
normalText('• JWT is stateless - no need to store sessions on server');
normalText('• Scalable - works with multiple servers');
normalText('• Secure - token is signed and verified');
normalText('• Mobile friendly - works on apps and web');

doc.addPage();

// ==========================================
// 9. AUTHORIZATION & ROLES
// ==========================================
heading1('9. AUTHORIZATION & ROLES');

heading3('User Roles in This System:');

const roles = [
  ['Role', 'Can Do', 'Cannot Do'],
  ['customer', 'Register, login, add vehicles, book appointments, write reviews, view invoices', 'Create garage, assign mechanics, manage other users'],
  ['garage_owner', 'Create garage, add mechanics, manage services, update bookings', 'Book services, review other garages'],
  ['mechanic', 'Accept bookings, update booking status, send messages', 'Create garage, manage vehicles'],
  ['admin', 'Everything - view all users, delete accounts, manage entire system', 'Nothing - full access']
];
table(roles, [90, 280, 280]);

doc.moveDown(0.3);

heading3('How Authorization Works:');
normalText('• Middleware checks user role from JWT token');
normalText('• allowRoles("customer") - only allows customers');
normalText('• allowRoles("garage_owner") - only allows garage owners');
normalText('• If user doesn\'t have required role, gets 403 error: "You are not authorized"');

doc.moveDown(0.3);

heading3('Authorization Examples:');
normalText('• Only customers can create bookings');
normalText('• Only garage owners can create garages');
normalText('• Only customer who owns a vehicle can update it');
normalText('• Only customer who booked can leave review for that booking');
normalText('• Only admin can see all users');

doc.addPage();

// ==========================================
// 10. POSTMAN TESTING GUIDE
// ==========================================
heading1('10. COMPLETE POSTMAN TESTING GUIDE');

normalText('This step-by-step guide will help you test every API endpoint.');
normalText('Prerequisites: MongoDB running, backend running on http://localhost:3000');

doc.moveDown(0.3);

heading2('Step 1: Start MongoDB');
normalText('Open MongoDB Compass or start MongoDB service');
normalText('Connection: mongodb://127.0.0.1:27017');

doc.moveDown(0.3);

heading2('Step 2: Start Backend');
codeBlock('cd d:\\CODEEING\\AT\\VehicleServicesManagementSystem\\my-backend');
codeBlock('node server.js');
normalText('Should see: "Server running on port 3000"');

doc.moveDown(0.3);

heading2('Step 3: Open Postman');
normalText('Create new workspace or open existing one');
normalText('Set Base URL to: http://localhost:3000');

doc.moveDown(0.3);

heading2('Step 4: TEST USER REGISTRATION');
normalText('Create new request:');
normalText('Method: POST');
normalText('URL: http://localhost:3000/users/register');
normalText('Headers:');
normalText('  Content-Type: application/json');
normalText('Body (JSON):');
doc.moveDown(0.1);
codeBlock('{');
codeBlock('  "name": "Test Customer",');
codeBlock('  "email": "customer@test.com",');
codeBlock('  "mobile": "9876543210",');
codeBlock('  "password": "password123",');
codeBlock('  "role": "customer"');
codeBlock('}');
normalText('Expected Response: 201 Created with user data and JWT token');
normalText('Copy the token from response - you\'ll need it for next requests');

doc.moveDown(0.3);
normalText('Also register these users:');
codeBlock('Garage Owner:');
codeBlock('  email: owner@test.com, role: garage_owner');
codeBlock('');
codeBlock('Mechanic:');
codeBlock('  email: mechanic@test.com, role: mechanic');

doc.addPage();

heading2('Step 5: TEST USER LOGIN');
normalText('Method: POST');
normalText('URL: http://localhost:3000/users/login');
normalText('Headers: Content-Type: application/json');
normalText('Body:');
codeBlock('{');
codeBlock('  "email": "customer@test.com",');
codeBlock('  "password": "password123"');
codeBlock('}');
normalText('Expected: 200 OK with user data and token');
normalText('This token is used for all authenticated requests');

doc.moveDown(0.3);

heading2('Step 6: TEST ADD VEHICLE');
normalText('Method: POST');
normalText('URL: http://localhost:3000/vehicles');
normalText('Headers:');
normalText('  Content-Type: application/json');
normalText('  Authorization: Bearer <paste_customer_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "vehicleNumber": "MH12TEST01",');
codeBlock('  "brand": "Toyota",');
codeBlock('  "model": "Innova",');
codeBlock('  "fuelType": "Diesel",');
codeBlock('  "manufacturingYear": 2020');
codeBlock('}');
normalText('Expected: 201 Created with vehicle details including vehicleId');
normalText('Copy vehicleId for booking creation');

doc.moveDown(0.3);

heading2('Step 7: TEST GET VEHICLES');
normalText('Method: GET');
normalText('URL: http://localhost:3000/vehicles');
normalText('Headers: Authorization: Bearer <customer_token>');
normalText('Expected: 200 OK with list of vehicles');

doc.moveDown(0.3);

heading2('Step 8: CREATE GARAGE (as garage_owner)');
normalText('Method: POST');
normalText('URL: http://localhost:3000/garages');
normalText('Headers:');
normalText('  Content-Type: application/json');
normalText('  Authorization: Bearer <paste_garage_owner_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "name": "ABC Car Service",');
codeBlock('  "address": "123 Main Street, City",');
codeBlock('  "phone": "9999999999",');
codeBlock('  "description": "Professional car service center",');
codeBlock('  "services": [');
codeBlock('    {');
codeBlock('      "name": "Oil Change",');
codeBlock('      "description": "Complete oil change service",');
codeBlock('      "price": 500,');
codeBlock('      "durationMinutes": 30');
codeBlock('    },');
codeBlock('    {');
codeBlock('      "name": "General Service",');
codeBlock('      "description": "Complete vehicle checkup",');
codeBlock('      "price": 2000,');
codeBlock('      "durationMinutes": 120');
codeBlock('    }');
codeBlock('  ]');
codeBlock('}');
normalText('Expected: 201 Created with garage details and garageId');
normalText('Copy garageId for booking creation');

doc.addPage();

heading2('Step 9: ADD MECHANIC TO GARAGE (as garage_owner)');
normalText('Method: POST');
normalText('URL: http://localhost:3000/garages/<garageId>/mechanics');
normalText('Headers: Authorization: Bearer <garage_owner_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "mechanicId": "<mechanic_user_id>"');
codeBlock('}');
normalText('Note: Get mechanic user ID from step where mechanic registered');
normalText('Expected: 200 OK with updated garage including mechanics list');

doc.moveDown(0.3);

heading2('Step 10: DISCOVER GARAGES (public)');
normalText('Method: GET');
normalText('URL: http://localhost:3000/api/garages');
normalText('Headers: No authorization needed');
normalText('Optional query:');
normalText('  ?service=Oil Change - filter by service');
normalText('  ?search=ABC - search by garage name/address');
normalText('Expected: 200 OK with list of all garages');

doc.moveDown(0.3);

heading2('Step 11: CREATE BOOKING (as customer)');
normalText('Method: POST');
normalText('URL: http://localhost:3000/bookings');
normalText('Headers: Authorization: Bearer <customer_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "vehicle": "<vehicleId>",');
codeBlock('  "garage": "<garageId>",');
codeBlock('  "mechanic": "<mechanicId>",');
codeBlock('  "service": "Oil Change",');
codeBlock('  "appointmentAt": "2024-09-15T10:00:00Z",');
codeBlock('  "notes": "Please check brakes too"');
codeBlock('}');
normalText('Note: appointmentAt must be in future');
normalText('Expected: 201 Created with booking details and bookingId');
normalText('Copy bookingId for messages and invoice');

doc.moveDown(0.3);

heading2('Step 12: GET BOOKINGS');
normalText('Method: GET');
normalText('URL: http://localhost:3000/bookings');
normalText('Headers: Authorization: Bearer <token>');
normalText('Results filter by role:');
normalText('• Customer: Sees only their bookings');
normalText('• Garage Owner: Sees bookings for their garages');
normalText('• Mechanic: Sees bookings assigned to them');
normalText('Expected: 200 OK with filtered list');

doc.addPage();

heading2('Step 13: UPDATE BOOKING STATUS (as mechanic/garage owner)');
normalText('Method: PATCH');
normalText('URL: http://localhost:3000/bookings/<bookingId>');
normalText('Headers: Authorization: Bearer <mechanic_or_owner_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "status": "in-progress"');
codeBlock('}');
normalText('Valid statuses: pending, confirmed, in-progress, completed');
normalText('Expected: 200 OK with updated booking');

doc.moveDown(0.3);

heading2('Step 14: SEND CHAT MESSAGE');
normalText('Method: POST');
normalText('URL: http://localhost:3000/api/chat/<bookingId>');
normalText('Headers: Authorization: Bearer <customer_or_mechanic_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "text": "When will my car be ready?",');
codeBlock('  "imageUrl": "https://example.com/image.jpg"  [optional]');
codeBlock('}');
normalText('Expected: 201 Created with message details');

doc.moveDown(0.3);

heading2('Step 15: GET MESSAGES FOR BOOKING');
normalText('Method: GET');
normalText('URL: http://localhost:3000/api/chat/<bookingId>');
normalText('Headers: Authorization: Bearer <token>');
normalText('Expected: 200 OK with all messages for that booking');

doc.moveDown(0.3);

heading2('Step 16: WRITE REVIEW (after booking completed)');
normalText('Method: POST');
normalText('URL: http://localhost:3000/api/reviews');
normalText('Headers: Authorization: Bearer <customer_token>');
normalText('Body:');
codeBlock('{');
codeBlock('  "booking": "<bookingId>",');
codeBlock('  "rating": 5,');
codeBlock('  "comment": "Great service! Very professional mechanics"');
codeBlock('}');
normalText('Note: Only works if booking status is "completed"');
normalText('Expected: 201 Created with review details');

doc.moveDown(0.3);

heading2('Step 17: GET REVIEWS FOR GARAGE');
normalText('Method: GET');
normalText('URL: http://localhost:3000/api/garages/<garageId>/reviews');
normalText('Headers: No authorization needed');
normalText('Expected: 200 OK with all reviews for that garage');

doc.addPage();

heading2('Step 18: ERROR TESTING');

normalText('Test 1: Missing Required Field');
normalText('Try registering without email:');
codeBlock('POST /users/register');
codeBlock('{ "name": "John", "password": "123456" }');
normalText('Expected: 400 Bad Request - "Email and mobile are required"');

normalText('Test 2: Duplicate Email');
normalText('Try registering with same email twice:');
normalText('First registration succeeds');
normalText('Second registration:');
normalText('Expected: 400 Bad Request - "User already exists"');

normalText('Test 3: Wrong Password');
codeBlock('POST /users/login');
codeBlock('{ "email": "customer@test.com", "password": "wrongpassword" }');
normalText('Expected: 401 Unauthorized - "Invalid email or password"');

normalText('Test 4: Missing Authentication Token');
normalText('Try to add vehicle without Authorization header:');
codeBlock('POST /vehicles (no token)');
normalText('Expected: 401 Unauthorized - "Authentication required"');

normalText('Test 5: Invalid Token');
codeBlock('POST /vehicles');
codeBlock('Authorization: Bearer invalid_token_here');
normalText('Expected: 401 Unauthorized - "Invalid or expired token"');

normalText('Test 6: Unauthorized Role');
normalText('Try to create garage as customer:');
codeBlock('POST /garages (with customer token)');
normalText('Expected: 403 Forbidden - "You are not authorized"');

normalText('Test 7: Booking Appointment in Past');
codeBlock('POST /bookings');
codeBlock('{ "appointmentAt": "2020-01-01T10:00:00Z" }');
normalText('Expected: 400 Bad Request - "Appointment must be in the future"');

normalText('Test 8: Vehicle Not Found');
codeBlock('PUT /vehicles/invalid123 (with customer token)');
normalText('Expected: 404 Not Found - "Vehicle not found"');

doc.addPage();

// ==========================================
// 11. TEST DATA PLAN
// ==========================================
heading1('11. CONNECTED TEST DATA PLAN');

normalText('Use this realistic test data for complete testing:');

doc.moveDown(0.3);
heading3('Users to Create:');

const testUsers = [
  ['User Type', 'Name', 'Email', 'Mobile', 'Password', 'Role'],
  ['Customer 1', 'Rahul Kumar', 'rahul@test.com', '9876543210', 'Password123', 'customer'],
  ['Customer 2', 'Priya Singh', 'priya@test.com', '9876543211', 'Password123', 'customer'],
  ['Garage Owner', 'Amit Patel', 'amit@test.com', '9876543212', 'Password123', 'garage_owner'],
  ['Mechanic 1', 'Raj Verma', 'raj@test.com', '9876543213', 'Password123', 'mechanic'],
  ['Mechanic 2', 'Vikas Singh', 'vikas@test.com', '9876543214', 'Password123', 'mechanic'],
  ['Admin', 'Admin User', 'admin@test.com', '9876543215', 'Password123', 'admin']
];
table(testUsers, [85, 130, 140, 130, 130, 130]);

doc.moveDown(0.3);
heading3('Vehicles to Create (as Rahul):');

const testVehicles = [
  ['Vehicle Number', 'Brand', 'Model', 'Fuel Type', 'Year'],
  ['MH12AB1234', 'Toyota', 'Innova', 'Diesel', '2020'],
  ['MH12AB5678', 'Honda', 'Accord', 'Petrol', '2022'],
  ['MH12AB9999', 'Maruti', 'Swift', 'Petrol', '2019']
];
table(testVehicles, [140, 110, 120, 130, 100]);

normalText('Priya should create her own vehicles too');

doc.moveDown(0.3);
heading3('Garages to Create (as Amit):');

normalText('Garage 1: "Premium Auto Service"');
normalText('  Address: "123 MG Road, Pune"');
normalText('  Services: Oil Change (₹500), General Service (₹2000), AC Service (₹1500)');
normalText('  Add mechanics: Raj and Vikas');

normalText('Garage 2: "Quick Fix Garage"');
normalText('  Address: "456 Viman Nagar, Pune"');
normalText('  Services: Tire Change (₹1000), Battery (₹3000)');
normalText('  Add mechanics: Raj');

doc.moveDown(0.3);
heading3('Data Relationships:');

normalText('Rahul (Customer)');
normalText('  └─ Owns: MH12AB1234 (Innova)');
normalText('  └─ Owns: MH12AB5678 (Accord)');
normalText('     └─ Books: Oil Change at Premium Auto Service');
normalText('        └─ Assigned to: Raj (Mechanic)');
normalText('           └─ Creates Review: 5 stars');
normalText('              └─ Creates Invoice: ₹500 + tax');
normalText('');
normalText('Priya (Customer)');
normalText('  └─ Owns: Vehicle X');
normalText('     └─ Books: General Service at Premium Auto Service');
normalText('        └─ Assigned to: Vikas (Mechanic)');

doc.addPage();

// ==========================================
// 12. MONGODB COMPASS TESTING
// ==========================================
heading1('12. MONGODB COMPASS VERIFICATION');

normalText('Use MongoDB Compass to visually verify data in the database:');

doc.moveDown(0.3);
heading2('Opening Compass:');
normalText('1. Open MongoDB Compass');
normalText('2. Connect to: mongodb://127.0.0.1:27017');
normalText('3. In left panel, expand "vehicleManagement" database');
normalText('4. You\'ll see 8 collections (if data exists)');

doc.moveDown(0.3);
heading2('Verify User Registration:');
normalText('1. Click on "users" collection');
normalText('2. See registered users with hashed passwords');
normalText('3. Verify fields: name, email, mobile, role');
normalText('4. Note: password is hashed (looks like: $2b$10$...)');

doc.moveDown(0.3);
heading2('Verify Vehicle Creation:');
normalText('1. Click on "vehicles" collection');
normalText('2. See all created vehicles');
normalText('3. Click on one vehicle document');
normalText('4. Verify: owner (references user ID), vehicleNumber, brand, model');
normalText('5. Expand "owner" field - should show it links to user ID');

doc.moveDown(0.3);
heading2('Verify Garage:');
normalText('1. Click on "garages" collection');
normalText('2. Click on garage document');
normalText('3. Verify: name, address, services array, mechanics array');
normalText('4. Expand "services" - see service objects with name, price, durationMinutes');
normalText('5. Expand "mechanics" array - shows mechanic user IDs');

doc.moveDown(0.3);
heading2('Verify Booking:');
normalText('1. Click on "bookings" collection');
normalText('2. Click on booking document');
normalText('3. Verify: customer ID, vehicle ID, garage ID, mechanic ID');
normalText('4. See service object: { name, price }');
normalText('5. Check appointmentAt date and status field');

doc.moveDown(0.3);
heading2('Verify Invoice:');
normalText('1. Click on "invoices" collection');
normalText('2. Click on invoice document');
normalText('3. Verify calculation: total = serviceCharges + sparePartsCost + tax');
normalText('4. Check paymentStatus field');

doc.moveDown(0.3);
heading2('Verify Review:');
normalText('1. Click on "reviews" collection');
normalText('2. Verify: booking ID, customer ID, garage ID, rating, comment');
normalText('3. Note: createdAt timestamp auto-added');

doc.moveDown(0.3);
heading2('Verify Messages:');
normalText('1. Click on "messages" collection');
normalText('2. Verify: booking ID, sender ID, recipient ID, text, createdAt');
normalText('3. Can see message timeline by sorting by createdAt');

doc.moveDown(0.3);
heading2('Verify Notifications:');
normalText('1. Click on "notifications" collection');
normalText('2. Verify: recipient ID, type, message, read status');
normalText('3. Check if read field changes when marked as read');

doc.addPage();

// ==========================================
// 13. COMPLETE TESTING CHECKLIST
// ==========================================
heading1('13. COMPLETE TESTING CHECKLIST');

normalText('Use this checklist to ensure everything works:');
doc.moveDown(0.3);

const checklist = [
  'ENVIRONMENT SETUP',
  '□ MongoDB is installed and running',
  '□ Node.js and npm installed',
  '□ Backend code is in d:\\CODEEING\\AT\\VehicleServicesManagementSystem\\my-backend',
  '□ npm install completed (all dependencies installed)',
  '□ .env file has correct MongoDB URI (if needed)',
  '',
  'DATABASE',
  '□ MongoDB compass connects successfully',
  '□ vehicleManagement database is created after first request',
  '□ All 8 collections appear in compass after tests',
  '',
  'SERVER',
  '□ Backend starts with "node server.js"',
  '□ No connection errors in console',
  '□ Server shows "Server running on port 3000"',
  '□ GET http://localhost:3000 returns status "ok"',
  '',
  'AUTHENTICATION',
  '□ User can register with valid data',
  '□ Registration fails with missing fields',
  '□ Registration fails with duplicate email',
  '□ Password is hashed (not plaintext in database)',
  '□ User can login with correct email/password',
  '□ Login fails with wrong password',
  '□ JWT token is returned on successful login',
  '□ Protected endpoints reject requests without token',
  '□ Protected endpoints reject requests with invalid token',
  '',
  'USER MANAGEMENT',
  '□ Can register as customer',
  '□ Can register as garage_owner',
  '□ Can register as mechanic',
  '□ Can login and get JWT',
  '□ Can update own profile',
  '□ Customer cannot update other user profile',
  '□ Admin can get all users list',
  '□ Non-admin cannot get users list',
  '',
  'VEHICLES',
  '□ Customer can add vehicle',
  '□ Customer can view their vehicles',
  '□ Customer can update their vehicle',
  '□ Customer can delete their vehicle',
  '□ Mechanic cannot add vehicles',
  '□ Vehicle is linked to correct owner in database',
  '□ Cannot add vehicle with duplicate number',
  '',
  'GARAGES',
  '□ Garage owner can create garage',
  '□ Customer cannot create garage',
  '□ Garage owner can list their garages',
  '□ Garage owner can update garage',
  '□ Garage owner can add mechanic to garage',
  '□ Public can discover all garages',
  '□ Public can search garages by service name',
  '□ Public can search garages by location/name',
  '',
  'BOOKINGS',
  '□ Customer can create booking',
  '□ Booking requires valid vehicle ID',
  '□ Booking requires valid garage ID',
  '□ Booking requires future appointment date',
  '□ Booking fails if appointment is in past',
  '□ Garage owner can see bookings for their garage',
  '□ Mechanic can see assigned bookings',
  '□ Customer can see their bookings',
  '□ Status can be updated (pending → confirmed → in-progress → completed)',
  '',
  'REVIEWS',
  '□ Customer can write review after booking completed',
  '□ Cannot review if booking not completed',
  '□ Review saved with rating (1-5)',
  '□ Review saved with comment',
  '□ Public can view garage reviews',
  '□ Customer can update own review',
  '□ Customer can delete own review',
  '',
  'MESSAGING',
  '□ Customer can send message to mechanic',
  '□ Mechanic can send message to customer',
  '□ Messages are linked to booking',
  '□ Messages appear with timestamps',
  '□ Only booking participants can see messages',
  '',
  'NOTIFICATIONS',
  '□ Notifications created for booking updates',
  '□ User can view their notifications',
  '□ User can mark notification as read',
  '',
  'INVOICES',
  '□ Invoice created after booking completed',
  '□ Invoice shows correct amounts',
  '□ Customer can view their invoices',
  '□ Invoice shows payment status',
  '',
  'ERROR HANDLING',
  '□ Missing required field returns 400 error',
  '□ Non-existent ID returns 404 error',
  '□ Unauthorized access returns 403 error',
  '□ Invalid token returns 401 error',
  '□ Server error returns 500 error',
  '□ All errors return descriptive message',
  '',
  'DATA INTEGRITY',
  '□ MongoDB shows correct data for all users',
  '□ Relationships between collections work',
  '□ Timestamps (createdAt, updatedAt) auto-populate',
  '□ Deleted records removed from database',
  '□ Updated records show new values immediately'
];

checklist.forEach(item => {
  if (item === '') {
    doc.moveDown(0.1);
  } else if (item.includes('□')) {
    normalText(item, 9);
  } else {
    heading3(item);
  }
});

doc.addPage();

// ==========================================
// 14. BEGINNER VIVA ANSWERS
// ==========================================
heading1('14. BEGINNER VIVA ANSWERS');

normalText('Common questions you might face in viva/interview:');
doc.moveDown(0.3);

heading3('Q: What is Node.js?');
normalText('A: Node.js is a JavaScript runtime environment that allows JavaScript code to run on servers (not just browsers). It\'s built on Chrome\'s V8 engine and is very fast for I/O operations.');

heading3('Q: What is Express?');
normalText('A: Express is a lightweight web framework for Node.js that simplifies creating REST APIs. It handles HTTP requests/responses, routing, middleware, etc. Makes server development much easier.');

heading3('Q: What is MongoDB?');
normalText('A: MongoDB is a NoSQL database that stores data in JSON-like documents instead of rows and columns. It\'s flexible - you can change data structure without migrations. Data is stored in collections.');

heading3('Q: What is Mongoose?');
normalText('A: Mongoose is a library that provides schema validation and ORM-like features for MongoDB. It helps define data structure (schemas), validate data before saving, and simplifies database operations.');

heading3('Q: What is an API?');
normalText('A: API (Application Programming Interface) is a way for applications to communicate. REST API uses HTTP methods (GET, POST, PUT, DELETE) on URLs to request/provide data. Our backend is a REST API.');

heading3('Q: What is CRUD?');
normalText('A: CRUD = Create, Read, Update, Delete. These are the four basic operations on data.');
normalText('  • CREATE (POST) - Add new data');
normalText('  • READ (GET) - Retrieve data');
normalText('  • UPDATE (PUT/PATCH) - Modify existing data');
normalText('  • DELETE (DELETE) - Remove data');

doc.moveDown(0.2);

heading3('Q: What is JWT (JSON Web Token)?');
normalText('A: JWT is a secure token that proves a user is authenticated. After login, client receives a JWT token. This token is sent in every request to prove the user is logged in. Server verifies token using a secret key.');

heading3('Q: Why do we use bcrypt?');
normalText('A: bcrypt is a password hashing library. Instead of storing plain passwords, we hash them using bcrypt. This way, even if database is hacked, passwords are protected. bcrypt also adds "salt" for extra security.');

doc.addPage();

heading3('Q: What is a controller?');
normalText('A: Controller is a file containing functions that handle business logic. Each route points to a controller function. Controller receives request, processes it (with database), and sends response.');

heading3('Q: What is a route?');
normalText('A: Route maps an HTTP method + URL to a controller function. Example: POST /users/register → registerUser() function. Routes define all available API endpoints.');

heading3('Q: What is a model?');
normalText('A: Model is a Mongoose schema definition. It defines what fields a collection has, their data types, and validation rules. Model represents the structure of data in MongoDB.');

heading3('Q: What is middleware?');
normalText('A: Middleware is code that runs between receiving request and sending response. Example: auth.js middleware checks JWT token before allowing request to reach controller.');

heading3('Q: How does Postman connect to backend?');
normalText('A: Postman sends HTTP requests to backend URL (http://localhost:3000/...). Backend receives request, processes it, and sends back HTTP response. Postman displays the response.');

heading3('Q: How does data flow from API to MongoDB?');
normalText('A: Postman → HTTP Request → Express Route → Controller Function → Mongoose Model → MongoDB Database → Response back to Postman');

heading3('Q: What is authentication?');
normalText('A: Authentication = proving you are who you claim. Usually email + password. Backend checks credentials and issues JWT token.');

heading3('Q: What is authorization?');
normalText('A: Authorization = what are you allowed to do after authentication. Example: Only customers can add vehicles, only garage owners can create garages.');

heading3('Q: What is the difference between 401 and 403 errors?');
normalText('A: 401 = Not authenticated (no token or invalid token). 403 = Authenticated but not authorized (don\'t have required role).');

heading3('Q: What is NoSQL?');
normalText('A: NoSQL = database without fixed table structure. Documents can have different fields. More flexible than SQL. MongoDB is NoSQL.');

heading3('Q: What is the difference between SQL and NoSQL?');
normalText('A: SQL has fixed table structure with rows/columns. NoSQL stores flexible documents. NoSQL is good for varying data. MongoDB (NoSQL) is easier for rapid development.');

heading3('Q: Why use MongoDB instead of MySQL?');
normalText('A: MongoDB stores data as JSON (easy to work with in JavaScript). Schema is flexible (can add fields anytime). No complex joins. Good for applications with varying data structure.');

doc.addPage();

// ==========================================
// 15. COMPLETE BACKEND FLOW DIAGRAM
// ==========================================
heading1('15. COMPLETE BACKEND FLOW DIAGRAM');

normalText('This diagram shows how data flows through the entire backend:');
doc.moveDown(0.3);

codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                         POSTMAN CLIENT                      │');
codeBlock('│          (or any HTTP client - web app, mobile app)         │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ HTTP Request');
codeBlock('                       │ POST /users/register');
codeBlock('                       │ { name, email, password }');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                   EXPRESS SERVER                            │');
codeBlock('│                 (server.js starts here)                      │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ Routes match URL /users/register');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                    ROUTES                                   │');
codeBlock('│              (routes/userRoutes.js)                          │');
codeBlock('│         Maps to userController.registerUser()               │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                 CONTROLLER                                  │');
codeBlock('│     (controllers/userController.js)                          │');
codeBlock('│    registerUser() function processes request                │');
codeBlock('│    • Validates data                                         │');
codeBlock('│    • Hashes password with bcrypt                            │');
codeBlock('│    • Creates User model instance                            │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ new User({ ... })');
codeBlock('                       │ user.save()');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                   MONGOOSE MODEL                            │');
codeBlock('│              (models/User.js)                                │');
codeBlock('│  • Validates against schema                                 │');
codeBlock('│  • Converts JavaScript object to MongoDB format             │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ MongoDB command');
codeBlock('│                       INSERT INTO users VALUES (...)');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                 MONGODB DATABASE                            │');
codeBlock('│        (vehicleManagement database/users collection)        │');
codeBlock('│    Document inserted with _id and all user fields          │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ Returns saved document with _id');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│              CONTROLLER CREATES JWT TOKEN                   │');
codeBlock('│    jwt.sign({ userId, role }, secret, { expiresIn })      │');
codeBlock('│          Returns: JWT token string                          │');
codeBlock('└──────────────────────┬──────────────────────────────────────┘');
codeBlock('                       │');
codeBlock('                       │ HTTP Response');
codeBlock('                       │ 201 Created');
codeBlock('                       │ { user: {...}, token: "JWT..." }');
codeBlock('                       ↓');
codeBlock('┌─────────────────────────────────────────────────────────────┐');
codeBlock('│                  POSTMAN RECEIVES');
codeBlock('│              Response with user data and JWT                │');
codeBlock('│         Client stores JWT for future authenticated requests │');
codeBlock('└─────────────────────────────────────────────────────────────┘');

doc.moveDown(0.3);

heading3('Example: Authenticated Request (Create Vehicle)');
normalText('After login, when making a request with JWT:');

codeBlock('REQUEST (with JWT):');
codeBlock('POST /vehicles');
codeBlock('Authorization: Bearer <JWT_TOKEN>');
codeBlock('');
codeBlock('FLOW:');
codeBlock('1. Express receives request');
codeBlock('2. Middleware (auth.js) checks Authorization header');
codeBlock('3. Middleware verifies JWT token');
codeBlock('4. If valid, extracts userId and role from token');
codeBlock('5. Loads user from database, attaches to req.user');
codeBlock('6. Route checks role: allowRoles("customer")');
codeBlock('7. If authorized, vehicleController.addVehicle() runs');
codeBlock('8. Controller creates Vehicle with owner = req.user._id');
codeBlock('9. Vehicle saved to MongoDB');
codeBlock('10. Response sent back to Postman');

doc.addPage();

// ==========================================
// 16. CONCLUSION
// ==========================================
heading1('16. CONCLUSION & NEXT STEPS');

normalText('Congratulations! You now understand your entire backend system.');

doc.moveDown(0.3);

heading3('What You Learned:');
normalText('✓ Project structure and how files connect');
normalText('✓ How Express routes work');
normalText('✓ How MongoDB and Mongoose work');
normalText('✓ CRUD operations');
normalText('✓ Authentication and JWT tokens');
normalText('✓ Authorization and roles');
normalText('✓ All API endpoints');
normalText('✓ How to test with Postman');
normalText('✓ How to verify data in MongoDB Compass');

doc.moveDown(0.3);

heading3('Key Concepts to Remember:');
normalText('1. Request flows: Postman → Route → Controller → Model → MongoDB → Response');
normalText('2. JWT tokens prove user is logged in');
normalText('3. Each collection has multiple documents');
normalText('4. Models define schema (structure) for data');
normalText('5. Controllers contain business logic');
normalText('6. Routes map URLs to controllers');
normalText('7. Middleware runs before controllers (like auth checks)');
normalText('8. Passwords are hashed with bcrypt');
normalText('9. Roles control what each user can do');
normalText('10. MongoDB stores data as JSON documents');

doc.moveDown(0.3);

heading3('Common Mistakes to Avoid:');
normalText('• Forgetting to add Authorization header with JWT in Postman');
normalText('• Assuming timestamps are in database by default (use { timestamps: true })');
normalText('• Storing passwords as plaintext (always use bcrypt)');
normalText('• Not checking user permissions (anyone could update anyone else\'s data)');
normalText('• Forgetting to validate required fields');
normalText('• Not handling errors properly');
normalText('• Using wrong HTTP method (GET vs POST)');

doc.moveDown(0.3);

heading3('Next Steps:');
normalText('1. Test the entire backend using this documentation');
normalText('2. Create test data with realistic scenarios');
normalText('3. Verify data in MongoDB Compass');
normalText('4. Try building simple features (e.g., delete user)');
normalText('5. Understand error handling');
normalText('6. Learn about deployment (deploy to AWS, Heroku, etc)');
normalText('7. Add more features (email verification, password reset, etc)');

doc.moveDown(0.3);

heading3('Resources to Learn More:');
normalText('• Express.js official docs: https://expressjs.com');
normalText('• MongoDB docs: https://docs.mongodb.com');
normalText('• Mongoose docs: https://mongoosejs.com');
normalText('• JWT: https://jwt.io');
normalText('• bcrypt: https://www.npmjs.com/package/bcrypt');

doc.moveDown(0.5);

normalText('Document created by GitHub Copilot - Vehicle Management Backend Complete Documentation', 8);
normalText(`Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`, 8);

doc.end();

console.log('PDF created successfully: Vehicle_Management_Backend_Documentation.pdf');
