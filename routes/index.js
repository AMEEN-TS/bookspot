var express = require('express');
const async = require('hbs/lib/async');
const { response } = require('../app');
var router = express.Router();
const userHelpers = require("../helpers/userHelpers");
const user = require("../models/user")
const adminHelpers = require("../helpers/adminHelpers");
const cart = require("../models/cart");
const product = require('../models/productData');
const  moment = require('moment');  
const storage = require("../middleware/multer");



/* GET home page. */

const verifyLogin = (req, res, next) => {
  if (req.session.logedin) {
    
    next();
  } else {
    res.redirect("/login");
  }
};

let filterResult;

router.get('/', async function (req, res, next) {
  let user = req.session.user;
  const products = await adminHelpers.getProducts();
  let cartCount = null;
  if (user) {
   cartCount =await userHelpers.getCartCount(req.session.user._id);
  }
  
  res.render('user/index', { user,products,cartCount });
});

router.get('/login', function (req, res, next) {
  if (req.session.logedin) {
    res.redirect("/");
  } 
   res.render("user/login", {
    signupSuccess: req.session.signupSuccess,
    loggErr: req.session.loggedInError,
    signuperror: req.session.loggErr2,
    passwordreset: req.session.message,
    title: "userLogin",
    layout: false

  });
  req.session.signupSuccess = null;
  req.session.loggErr2 = null;
  req.session.loggedInError = null;
  req.session.message = null;


});



router.get('/signup', function (req, res, next) {
  let user = req.session.user;
  res.render("user/signup", { layout: false });
});


router.post("/usignUp", function (req, res, next) {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.otp = response.otp;
    req.session.userdetails = response;
    res.redirect("/otp");
  })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/login");
    });

});

router.get("/otp", function (req, res, next) {
  res.render('user/user_otp', { layout: false, otpErr: req.session.otpError });
});

router.post("/otp_verify", async (req, res) => {
  if (req.session.otp == req.body.otpsignup) {
    let userData = req.session.userdetails;
    const adduser = await new user({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
    });
    await adduser.save();
    req.session.signupSuccess = "signup sucessful! please login to continue";
    res.redirect("/login");
  } else {
    console.log("otp incorrect");
    req.session.otpError = "OTP not matching";
    res.redirect("/otp");

  }
});

router.post("/userlogin", (req, res, next) => {
  // res.header(
  //   "Cache-control",
  //   "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  // );
  
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    console.log("inside doLogin");
    if (response.user) {
      req.session.logedin = true;
      req.session.user = response.user;
      res.redirect("/")
     }// else {
    //    res.redirect("/login")
    // }
  })
    .catch((err) => {
      req.session.loggedInError = err.msg;
      res.redirect("/login");
    });
});

router.get("/logout",function(req,res,next){
  res.redirect("/login");
  req.session.destroy();
});

router.get("/forgetPassword",function(req,res,next){
  res.render("user/forgetPassword",{layout:false});
});

router.post("/forget", async (req, res) => {
  userHelpers
    .doresetPasswordOtp(req.body)
    .then((response) => {
      console.log(response);
      req.session.otp = response.otp;
      req.session.userdetails = response;
      req.session.userRID = response._id;
      // console.log(req.session.userRID+'hhhhh');
      res.redirect("/otpReset");
    })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/login");
    });
});

router.get("/otpReset", function (req, res, next) {
  res.render("user/otpReset", { layout: false, otpErr: req.session.otpError });
});

router.post("/otpResetVerify", async (req, res) => {
  if (req.session.otp == req.body.otpsignup) {
    res.redirect("/newPassword");
  } else {
    console.log("otp incorrect");
    req.session.otpError = "OTP not matching!";
    res.redirect("/otpReset");
  }
});
router.get("/newPassword", function (req, res, next) {
  res.render("user/newPassword", {
    layout: false,
    otpErr: req.session.otpError,
    passErr: req.session.passErr,
  });
  req.session.passErr = null;
  req.session.otpError = null;
});

router.post("/RPass", async (req, res) => {
  console.log(req.body);
  if (req.body.password == req.body.confirmPassword) {
    userHelpers.doresetPass(req.body, req.session.userRID).then((response) => {
      console.log(response);
      req.session.message =
        "Password changed succesfully! Please login with new password";
      res.redirect("/login");
      console.log("Password updated");
    });
  } else {
    console.log("password mismatch");
    req.session.passErr = "Password mismatch";
    res.redirect("/newPassword");
  }
});
// router.get("/product",function(req,res,next){
//   let user = req.session.user;
//   res.render("user/product",{user})
// });

// router.get("/productDetail",function(req,res,next){
//   let user = req.session.user;
//   res.render("user/productDetail",{user})
// });

// router.get("/productDetail/:id", async (req,res)=>{
//   const product = await adminHelpers.getoneProduct(req.params.id);
//   console.log('get products');
//   console.log(product._id);
//   const categories = await adminHelpers.getCategories();
//   const subcategories =await adminHelpers.getSubcategories();
//   let user = req.session.user;
//   res.render("user/productDetail",{
//       //  user,
//       product,
//       categories,
//       subcategories,
//       layout:false
//   });

// });
router.get("/productDetail1/:id",async(req,res)=>{
  const user = req.session.user
  let product = await userHelpers.getSingleProduct(req.params.id)
  res.render("user/productDetail",{product,user})
});
router.get("/add-tocart/:id", verifyLogin, (req, res) => {
  userHelpers
    .addToCart(req.params.id, req.session.user._id)
    .then((response) => {
      console.log("req.session.user._id");
      res.json({ status: true });
      //   res.redirect("/");
      // });
    })
    .catch((error) => {
      console.log("33333333333333333333333");
      console.log(error.msg);
      res.redirect("/home");
    });
});
router.get("/cart", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
   let cartCount =await userHelpers.getCartCount(req.session.user._id);
  if (cartCount > 0) {
    console.log(" cart count");
    const subTotal = await userHelpers.subTotal(req.session.user._id);
    const totalAmount = await userHelpers.totalAmount(req.session.user._id);
    console.log(totalAmount);
    const netTotal = totalAmount.grandTotal.total;
    console.log("nettotal",netTotal);
    const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
    const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
    const cartItems = await userHelpers.getCartItems(req.session.user._id);
    console.log("cart 5555");
    console.log("cart get222222222222222222222");
    
    console.log("1",deliveryCharge);
    res.render("user/cart", {
      cartCount,
      user,
      cartItems,
      subTotal,
      netTotal,
      deliveryCharge,
      grandTotal,
    });
  } else {
    let cartItem = await userHelpers.getCartItems(req.session.user);
    let cartItems = cartItem ? product : [];
    cartItem=0
    netTotal = 0;
    cartCount = 0;
    deliveryCharge = 0;
    grandTotal = 0;
    res.render("user/cart", {
      
      cartItems,
      netTotal,
      cartCount,
      deliveryCharge,
      grandTotal,
      user,
    });
  }
});
router.post("/change-product-quantity", (req, res) => {
  userHelpers.changeProductQuantity(req.body, req.session.user).then();
  res.json({ status: true });
});


router.post("/removeProductFromCart", (req, res, next) => {
  userHelpers.removeProductFromCart(req.body, req.session.user).then(() => {
    res.json({ status: true });
  });
});
router.get("/checkout",async(req,res)=>{
  let user = req.session.user;
  const Addresses = await userHelpers.getAddresses(req.session.user);
  const cartItems = await userHelpers.getCartItems(req.session.user._id);
  const subTotal = await userHelpers.subTotal(req.session.user._id);
  const totalAmount = await userHelpers.totalAmount(req.session.user._id);
  const netTotal = totalAmount.grandTotal.total;
  const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
  res.render("user/checkout",{
    Addresses,
    netTotal,
    deliveryCharge,
    grandTotal,
    subTotal,
    user,
    cartItems,
  })
});
router.post("/placeOrder", async (req, res) => {
  const cartItem = await userHelpers.getCartItems(req.session.user._id);
  const totalAmount = await userHelpers.totalAmount(req.session.user._id);
  const netTotal = totalAmount.grandTotal.total;
  const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
  userHelpers
    .placeOrder(
      req.body,
      cartItem,
      grandTotal,
      deliveryCharge,
      netTotal,
      req.session.user
    )
    .then((response) => {
      req.session.orderId = response._id;
      const orderId = response._id;
      console.log(orderId);
      if (req.body["paymentMethod"] === "cod") {
        console.log("++");
        res.json({ codSuccess: true });
      } else {
        userHelpers.createRazorpay(orderId, grandTotal).then((response) => {
          res.json(response);
        });
      }
    });
});
router.post("/verifyPayment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers
        .changePayementStatus(req.body["order[receipt]"])
        .then((response) => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});
router.get("/viewOrderDetails", async (req, res) => {
  let user = req.session.user;
  userHelpers.getorderProducts(req.session.orderId).then((response) => {
    const orderProducts = response;
    console.log(orderProducts+'666666666666666666666666444444444444444444444');
    const ordered_on=moment(orderProducts.ordered_on).format('MMMM Do YYYY, h:mm:ss a');  
    res.render("user/orderSuccess", { user, orderProducts,ordered_on });
  });
});

router.get("/my",(req,res)=>{
  let user = req.session.user;
  console.log(user);userHelpers.getAllOrderList(user._id).then((response) => {
    const orderProducts = response;
    console.log(orderProducts+'444444444444444444444444444444444444444444');
    orderProducts.forEach(element => {
      element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
  
        });
    res.render("user/viewOrders", { user, orderProducts });
  });
 
});

router.get("/orderPage", async (req, res) => {
  let user = req.session.user;
  console.log(user);userHelpers.getAllOrderList(user._id).then((response) => {
    const orderProducts = response;
    console.log(orderProducts+'444444444444444444444444444444444444444444');
    orderProducts.forEach(element => {
      element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
  
        });
    res.render("user/viewOrders", { user, orderProducts  });
  });
});
router.get("/user",async(req,res)=>{
  const user = await userHelpers.userprofile(req.session.user);
  const Addresses = await userHelpers.getAddresses(req.session.user);
 
  res.render("user/userProfile",{user, Addresses})
});
router.post("/addAddress/:id", (req, res) => {
  userHelpers.addAddress(req.params.id, req.body).then((response) => {
    res.redirect("/user");
  });
});
router.post("/deleteAddress/", (req, res) => {
  userHelpers.deleteAddress(req.body, req.session.user).then((response) => {
    res.json({ status: true });
  });
});
router.post("/editAddress/:id",(req,res)=>{
  //  userHelpers.editAddress(req.body,req.session.user).then((response)=>{
  
  // })
  res.redirect("/user");
});
router.post("/Editproflie",storage.fields([
  {name:"image1",MaxCount:1}
]),
(req,res)=>{
  const img1 =  req.files.image1?req.files.image1[0].filename:req.body.image1;
  userHelpers.Editproflie(req.body, req.session.user._id,img1).then((response)=>{
    res.redirect("/user");
  })
}
);


// router.post("/Editproflie", (req, res) => {
  
//   userHelpers.Editproflie(req.body, req.session.user._id).then(() => {
    
//     res.redirect("/user");
//   });
// });

router.get("/add-Towishlist/:id",verifyLogin, (req, res, next) => {
  console.log(req.params.id);
  userHelpers.addTowishlist(req.params.id, req.session.user._id).then((response)=>{
    // console.log("lllllllllllll");
    res.json(response)
  }).catch((error)=>{
    res.redirect("/Login")

  })

  

});
router.get("/wishlist",verifyLogin,async(req,res)=>{
  let user = req.session.user;
  const wishlist = await userHelpers.getwishlist(req.session.user);
  let wishlistcount = await userHelpers.getwishlistcount(user._id);
  res.render("user/wishList",{wishlist,user,wishlistcount})

});
router.post("/deletewishlist", async (req, res) => {
  // console.log("fsdfgshfk");
  console.log(req.body);
  const wishlist=req.body.proId
  userHelpers.deletewishlist(wishlist, req.session.user._id).then((response) => {
    res.json({ status: true });
  });    
}); 

router.get("/orderTracking/:id",(req,res)=>{
  console.log(req.params.id);
  let user = req.session.user;
  userHelpers.getorderProducts(req.params.id).then((response)=>{
    const order= response;
    const ordered_on=moment(order.ordered_on).format('MMM Do YY');
    res.render("user/trackOrder",{user,order,ordered_on})
  })
});
router.get("/product",async(req,res)=>{
  console.log("**")
  let user = req.session.user;
  const products = await adminHelpers.getProducts();
  res.render("user/shop",{products,user})
})









module.exports = router;
