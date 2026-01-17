const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= MONGODB ================= */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@saif196.fkhluft.mongodb.net/?appName=saif196`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    // console.log("✅ MongoDB Connected");

    const db = client.db("bookPointDB");
    const booksCollection = db.collection("books");
    const cartCollection = db.collection("cart");
    const usersCollection = db.collection("users");
    const reviewsCollection = db.collection("reviews");


    /* ================= ROUTES ================= */

    // Test
    app.get("/", (req, res) => {
      res.send("📚 BookPoint Server is running");
    });

    /* ---------- BOOKS ---------- */





/* ================= REVIEWS ================= */
// 🔍 SEARCH BOOKS (name or author)
app.get("/books/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.send([]);
  }

  const result = await booksCollection.find({
    $or: [
      { name: { $regex: query, $options: "i" } },   // book name
      { author: { $regex: query, $options: "i" } }  // author name
    ]
  })
  .limit(8) // limit for dropdown
  .toArray();

  res.send(result);
});




app.post("/orders", async (req, res) => {
  const order = req.body;

  if (!order.userEmail || !order.items?.length) {
    return res.status(400).send({ message: "Invalid order data" });
  }

  const result = await ordersCollection.insertOne({
    ...order,
    createdAt: new Date(),
  });

  res.send(result);
});



// GET USER ORDERS
app.get("/orders", async (req, res) => {
  const email = req.query.email;
  const orders = await ordersCollection
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(orders);
});


// GET ALL ORDERS (ADMIN)
app.get("/admin/orders", async (req, res) => {
  const orders = await ordersCollection
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  res.send(orders);
});


/////////////////////////////////////////////

// Add review
app.post("/reviews", async (req, res) => {
  const review = req.body;

  if (!review.bookId || !review.userEmail || !review.comment) {
    return res.status(400).send({ message: "Invalid review data" });
  }

  const result = await reviewsCollection.insertOne({
    ...review,
    createdAt: new Date(),
  });

  res.send(result);
});

// Get reviews by book
app.get("/reviews/:bookId", async (req, res) => {
  const bookId = req.params.bookId;

  const reviews = await reviewsCollection
    .find({ bookId })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(reviews);
});

// Delete review
app.delete("/reviews/:id", async (req, res) => {
  const id = req.params.id;

  const result = await reviewsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});



    ////


    app.post("/users", async (req, res) => {
  const user = req.body;

  const query = { email: user.email };

  const isExist = await usersCollection.findOne(query);

  if (isExist) {
    return res.send({ message: "User already exists" });
  }

  const newUser = {
    name: user.name || "Anonymous",
    email: user.email,
    role: "user", // ✅ default role
    provider: user.provider || "password",
    createdAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser);
  res.send(result);
});


app.get("/users/role/:email", async (req, res) => {
  const email = req.params.email;
  const user = await usersCollection.findOne({ email });
  res.send({ role: user?.role || "user" });
});


    // Add book
    app.post("/books", async (req, res) => {
      const result = await booksCollection.insertOne(req.body);
      res.send(result);
    });

    // Get books with pagination
    app.get("/books", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 8;

      const books = await booksCollection
        .find()
        .skip(page * limit)
        .limit(limit)
        .toArray();

      const total = await booksCollection.countDocuments();

      res.send({ books, total });
    });

    // Popular books
    app.get("/books/popular", async (req, res) => {
      const books = await booksCollection
        .find()
        .sort({ "rating.average": -1 })
        .limit(10)
        .toArray();

      res.send(books);
    });

    // Book details
    app.get("/books/:id", async (req, res) => {
      const book = await booksCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(book);
    });

    // Books by category
    app.get("/books/category/:category", async (req, res) => {
      const books = await booksCollection
        .find({ category: req.params.category })
        .toArray();
      res.send(books);
    });

    /* ---------- CART ---------- */

    // Add to cart
    app.post("/cart", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    // Get user cart (🔥 FIXED)
    app.get("/my-cart", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send({ message: "Email required" });
  }

  const cartItems = await cartCollection.find({
    $or: [
      { userEmail: email }, // ✅ new correct field
      { email: email }      // ⚠️ old wrong field
    ]
  }).toArray();

  res.send(cartItems);
});


    // Delete cart item
    app.delete("/cart/:id", async (req, res) => {
      const result = await cartCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });


// GET ALL BOOKS (for /all-books page)
app.get("/books", async (req, res) => {
  const books = await booksCollection.find().toArray();
  res.send(books);
});


// ADD TO CART
app.post("/cart", async (req, res) => {
  const cartItem = req.body;

  // 🔒 validation
  if (!cartItem.userEmail || !cartItem.bookId) {
    return res.status(400).send({ message: "Invalid cart data" });
  }

  // 🔁 If same user adds same book → increase quantity
  const existingItem = await cartCollection.findOne({
    userEmail: cartItem.userEmail,
    bookId: cartItem.bookId,
  });

  if (existingItem) {
    const result = await cartCollection.updateOne(
      { _id: existingItem._id },
      { $inc: { quantity: 1 } }
    );
    return res.send({ message: "Quantity updated", result });
  }

  // ➕ New cart item
  const result = await cartCollection.insertOne({
    ...cartItem,
    quantity: cartItem.quantity || 1,
    addedAt: new Date(),
  });

  res.send(result);
});


// 🔎 SEARCH BOOKS (name or author)
app.get("/books/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.send([]);
  }

  const result = await booksCollection
    .find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ],
    })
    .limit(8)
    .toArray();

  res.send(result);
});


// 🔍 PROFESSIONAL SEARCH (name + author)
// 🔍 Smart Book Search
app.get("/books/search", async (req, res) => {
  const q = req.query.q;

  if (!q || q.trim().length < 1) {
    return res.send([]);
  }

  const regex = new RegExp(q, "i"); // case-insensitive

  const books = await booksCollection
    .find({
      $or: [
        { name: regex },
        { author: regex },
      ],
    })
    .limit(8)
    .toArray();

  res.send(books);
});





    //
    // UPDATE CART QUANTITY
app.patch("/cart/:id", async (req, res) => {
  const { quantity } = req.body;
  const id = req.params.id;

  if (quantity < 1) {
    return res.status(400).send({ message: "Quantity must be at least 1" });
  }

  const result = await cartCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { quantity } }
  );

  res.send(result);
});



    ///

  } catch (error) {
    console.error(error);
  }
}

run();

/* ================= SERVER ================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
