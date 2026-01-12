const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.DB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const port = process.env.PORT;
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("server running successfully");
});


const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({
        message: "no token found",
      });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    if (!decoded) {
      res.status(401).json({
        message: "unvalid token",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({
      message: "unauthorize user",
    });
  }
};

async function run() {
  try {
    await client.connect();
    const db = client.db("jwt-recap");
    const userCollection = db.collection("users");

    app.post("/signIn", async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            message: "already user exist !",
          });
        }
        const result = await userCollection.insertOne({
          name,
          email,
          password,
        });
        res.status(201).json({
          message: "user create successfully",
          result,
        });
      } catch (err) {
        res.status(400).json({
          message: "failed to create user",
        });
      }
    });

    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            message: "Enter email and password",
          });
        }

        const user = await userCollection.findOne({ email });

        const token = jwt.sign(
          {
            email: user.email,
            _id: user._id,
          },
          process.env.TOKEN_KEY,
          { expiresIn: "1h" }
        );

        res.status(200).send({
          message: "User Logged In Successfully",
          token,
        });
      } catch (err) {
        res.status(400).json({
          message: "Login Failed",
        });
      }
    });

    app.get("/me", verifyToken, async (req, res) => {
      try {
        const result = await userCollection.findOne(
          {
            _id: new ObjectId(req.user._id),
          },
          {
            projection: { password: 0 },
          }
        );
        res.status(200).send(result);
      } catch (err) {
        res.status(400).json({
          message: "Not Loggedin User",
        });
      }
    });

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
app.listen(port, () => {
  console.log(`server running on port : ${port}`);
});
