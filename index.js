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
    await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("bookPointDB");
    const booksCollection = db.collection("books");
    const cartCollection = db.collection("cart");

    /* ================= ROUTES ================= */

    // Test
    app.get("/", (req, res) => {
      res.send("📚 BookPoint Server is running");
    });

    /* ---------- BOOKS ---------- */

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

      const cartItems = await cartCollection
        .find({ userEmail: email })
        .toArray();

      res.send(cartItems);
    });

    // Delete cart item
    app.delete("/cart/:id", async (req, res) => {
      const result = await cartCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

  } catch (error) {
    console.error(error);
  }
}

run();

/* ================= SERVER ================= */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
