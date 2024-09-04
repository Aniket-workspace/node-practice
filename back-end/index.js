const express = require("express");
require("./db/config");
const User = require("./db/Users");
const cors = require("cors");
const Product = require("./db/Product");

const Jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const app = express();

app.use(express.json());
app.use(cors());

// signup
app.post("/signup", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, (err, token) => {
    if (err) {
      resp.send({ result: "Somthing went wrong, please try again later" });
    }
    resp.send({ result, auth: token });
  })
});

// login
app.post("/login", async (req, resp) => {
  console.log(req.body);
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, (err, token) => {
        if (err) {
          resp.send({ result: "Somthing went wrong, please try again later" });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({ result: "Invalid Credentials" });
    }
  } else {
    resp.send({ result: "Invalid Credentials" });
  }
});

// add product
app.post("/add-product", verifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

// products list
app.get("/products", verifyToken, async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No products found!" });
  }
});

// delete product
app.delete("/delete-product/:id", verifyToken, async (req, resp) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

// update product
app.get("/update-product/:id", verifyToken, async (req, resp) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No product found!" });
  }
});

app.put("/update-product/:id", verifyToken, async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

// search product
app.get("/search/:key", verifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [{ name: { $regex: req.params.key } }],
  });
  resp.send(result);
});

// token authorization
function verifyToken(req, resp, next){
  let token = req.headers['authorization']
  if(token){
    token = token.split(' ')[1]
    Jwt.verify(token, jwtKey, (err, valid)=>{
      if(err){
        resp.status(401).send({result:"Provide valid token"})
      }else{
        next()
      }
    })
  }else{
    resp.status(403).send({result:"Provide token"})
  }
}

app.listen(5000);
