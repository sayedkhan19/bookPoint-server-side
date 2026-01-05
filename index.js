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
