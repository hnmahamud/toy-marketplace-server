const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jia9zl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const toyDB = client.db("toyDB");
    const toys = toyDB.collection("toys");

    // Get all toy
    app.get("/toys", async (req, res) => {
      const currentPage = parseInt(req.query.currentPage) || 0;
      const itemsPerPage = parseInt(req.query.itemsPerPage) || 20;

      const skip = currentPage * itemsPerPage;
      const result = await toys.find().skip(skip).limit(itemsPerPage).toArray();

      res.send(result);
    });

    app.get("/totalToys", async (req, res) => {
      const result = await toys.estimatedDocumentCount();
      res.send({ totalToys: result });
    });

    // Get specific user toy
    app.get("/my-toys", async (req, res) => {
      const userEmail = req.query.email;
      const query = { seller_email: userEmail };
      const cursor = toys.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get specific toy by id
    app.get("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toys.findOne(query);
      res.send(result);
    });

    // Add a toy
    app.post("/toys", async (req, res) => {
      const toyInfo = req.body;
      const doc = {
        ...toyInfo,
      };
      const result = await toys.insertOne(doc);
      res.send(result);
    });

    // Update toy
    app.patch("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const toyInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...toyInfo,
        },
      };
      const result = await toys.updateOne(filter, updateDoc);
      if (result.modifiedCount > 0) {
        console.log("Successfully updated one document.");
      } else {
        console.log("No documents matched the query. Updated 0 documents.");
      }
      res.send(result);
    });

    // Delete a toy
    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toys.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server running...");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
