const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const { ObjectId } = require("mongodb");


const app = express();
const port = process.env.PORT || 5000;

/* ========== Middleware ========== */
app.use(cors());
app.use(express.json());

/* ========== MongoDB Connection ========== */
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


    /* ========== ROUTES ========== */

    // Test route
    app.get("/", (req, res) => {
      res.send("📚 BookPoint Server is running");
    });

    // ✅ ADD BOOK (THIS WAS MISSING)
    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    }); 


    //get popular books by rating
    app.get("/books/popular", async (req, res) => {
  const popularBooks = await booksCollection
    .find()
    .sort({ "rating.average": -1 })
    .limit(10)
    .toArray();

  res.send(popularBooks);
});

//get books by id
// ✅ GET BOOK DETAILS BY ID
app.get("/books/:id", async (req, res) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const book = await booksCollection.findOne(query);

  res.send(book);
});

//get books by category
// ✅ Get books by category
app.get("/books/category/:category", async (req, res) => {
  const category = req.params.category;

  const books = await booksCollection
    .find({ category })
    .toArray();

  res.send(books);
});


///
// GET /books?page=0&limit=8
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

//add to cart
app.post("/cart", async (req, res) => {
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem);
  res.send(result);
});

//email by card books show
// GET /my-books?email=user@gmail.com
// GET /my-cart?email=user@gmail.com
app.get("/my-cart", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send({ message: "Email required" });
  }

  const result = await cartCollection
    .find({ userEmail: email })
    .toArray();

  res.send(result);
});

// DELETE cart item by id
app.delete("/cart/:id", async (req, res) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const result = await cartCollection.deleteOne(query);

  res.send(result);
});




    // (optional) GET ALL BOOKS
    app.get("/books", async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.send(books);
    });

  } catch (error) {
    console.error(error);
  }
}

run();

/* ========== Start Server ========== */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
