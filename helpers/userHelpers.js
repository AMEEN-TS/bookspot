const db=require("../config/connections");
const userData=require("../models/user");
const nodeMailer=require("nodemailer");
const bcrypt=require("bcrypt");
const { promise, reject } = require("bcrypt/promises");
const async = require("hbs/lib/async");
const { status } = require("express/lib/response");
const productData =require("../models/productData")
const cart = require("../models/cart");
const { Mongoose, default: mongoose } = require("mongoose");
require("dotenv").config();
const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id:process.env.RAZORPAY_ID,
  key_secret:process.env.RAZORPAY_KEY,
});
const orderModel = require("../models/order");
const  moment = require('moment');  


const wishlistmodel = require("../models/wishlist");
const { resolve } = require("path");
const couponmodel = require("../models/Coupon");




module.exports={
    doSignup:(doData)=>{
        return new Promise(async ( resolve,reject)=>{
            const user =await userData.findOne({email:doData.email});
            if(user){
                reject({status:false,msg:"Email already taken"});
            } else{
                doData.password=await bcrypt.hash(doData.password,10);

                const otpGenerator = await Math.floor(10000+Math.random()*9000);
                const newUser= await {
                    name: doData.name,
                    phone: doData.phone,
                    email: doData.email,
                    password: doData.password,
                    otp: otpGenerator,
                };
                console.log(newUser);
                if(newUser){
                    try{
                        const mailTransporter = nodeMailer.createTransport({
                            host: "smtp.gmail.com",
                            service: "gmail",
                            port: 465,
                            secure: true,
                            auth:{
                                user:process.env.NODEMAILER_USER,
                                pass:process.env.NODEMAILER_PASS,
                            },
                            tls:{
                                rejectUnauthorized: false,
                            },
                        });

                        const mailDetails ={
                            from:"ameents.ts@gmail.com",
                            to: doData.email,
                            subject:"Book spot signup verification",
                            text: "just random texts",
                            html: "<p> hi " + doData.name + " your otp " + otpGenerator + "",

                        };
                        mailTransporter.sendMail(mailDetails,(err,Info)=>{
                            if(err){
                                console.log(err);
                            }else{
                                console.log("email has been sent",Info.response);
                            }
                        });
                    }catch(err){
                        console.log(err.message);
                    }
                }
                resolve(newUser);
            }
        });
    },

    doLogin: (userDataaa) => {
        console.log(userDataaa);
        return new Promise(async (resolve, reject) => {
          let loginStatus = false;
          let response = {};
          let user = await userData.findOne({ email: userDataaa.email });
          // let admin= await adminData.findOne({email:userDataaa.email})
          // console.log(userData);
          // console.log(user.email);
    
          if (user) {
            if (user.block){
              reject({ status: false, msg: "Your account has been blocked!" });
            }else{
            
            console.log(user);
            
            console.log(userDataaa.password);
            console.log(user.password);
            bcrypt.compare(userDataaa.password, user.password).then((status) => {
              if (status) {
                console.log("Login Success!");
                response.user = user;
                response.status = true;
                resolve(response);
                console.log(response + "1234");
              } else {
                console.log("Login Failed");
                reject({ status: false, msg: "Password not matching!" });
              }
            });
          }
          } else {
            console.log("Login Failed");
            reject({ status: false, msg: "Email not registered, please sign up!" });
          }
        });
      },

      doresetPasswordOtp: (resetData) => {
        return new Promise(async (resolve, reject) => {
          const user = await userData.findOne({ email: resetData.email });
          
          console.log(user);
          if (user) {
            // resetData.password = await bcrypt.hash(resetData.password, 10);
    
            const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
            const newUser = await {            
              email: resetData.email,
              otp: otpGenerator,
              _id:user._id
              
            };
            console.log(newUser);
    
            try {
              const mailTransporter = nodeMailer.createTransport({
                host: "smtp.gmail.com",
                service: "gmail",
                port: 465,
                secure: true,
                auth: {
                  user: process.env.NODEMAILER_USER,
                  pass: process.env.NODEMAILER_PASS,
                },
                tls: {
                  rejectUnauthorized: false,
                },
              });
    
              const mailDetails = {
                from:"ameents.ts@gmail.com" ,
                to: resetData.email,
                subject: "Book spot signup verification",
                text: "just random texts ",
                html: "<p>Hi " + "user, " + "your otp for resetting BookSpot account password is " + otpGenerator+".",
              };
              mailTransporter.sendMail(mailDetails, (err, Info) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("email has been sent ", Info.response);
                }
              });
            } catch (error) {
              console.log(error.message);
            }
    
            resolve(newUser);
    
    
          } else {
            reject({ status: false, msg: "Email not registered, please sign up!" });
          }
        });
      },
    

      doresetPass: (rData,rid) => {
        console.log(rData);
        return new Promise(async (resolve, reject) => {
          let response = {};
          rData.password = await bcrypt.hash(rData.password, 10);
          // console.log(rData.password+'fi');
          // console.log(userData.email+"aa");
    
          let userId =rid
          console.log(userId+'12');
          let resetuser = await userData.findByIdAndUpdate({_id:userId},
            {$set:{password:rData.password}})
    
          // let user = await userData.findOne({ email: rData.email });
          // // let admin= await adminData.findOne({email:userDataaa.email})
          // // console.log(userData);
          // // console.log(user.email);
    resolve(resetuser)
          
      })
    },
    getSingleProduct:(data)=>{
      return new Promise(async(resolve,reject)=>{
    
      await productData.findOne({_id:data}).populate("category").populate("subcategory").lean().then((product)=>{
        resolve(product)
        })
        
       
      })
    },
    addToCart: (pro_Id, user_Id) => {
      return new Promise(async (resolve, reject) => {
        const alreadyCart = await cart.findOne({ user_Id: user_Id });
        const product = await productData.findById({ _id: pro_Id });
        if (alreadyCart) {
          let proExist = alreadyCart.products.findIndex(
            (products) => products.pro_Id == pro_Id
          );
          if (proExist != -1) {
            console.log(proExist);
            cart
              .updateOne(
                { "products.pro_Id": pro_Id, user_Id: user_Id },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              )
              .then((response) => {
                console.log("11111111111111111111111");
                resolve();
              });
          } else {
            await cart
              .findOneAndUpdate(
                { user_Id: user_Id },
                { $push: { products: { pro_Id: pro_Id, price: product.price } } }
              )
              .then(async (res) => {
                resolve({ msg: '"Added", count: res.product.length + 1 ' });
              });
          }
        } else {
          const newcart = new cart({
            user_Id: user_Id,
            products: { pro_Id: pro_Id, price: product.price },
          });
          await newcart.save((err, result) => {
            if (err) {
              resolve({ error: "cart not created" });
            } else {
              resolve({ msg: "cart created", count: 1 });
            }
          });
        }
      });
    },
    getCartCount: (userid) => {
      return new Promise(async (resolve, reject) => {
         let count=0
        const user = await cart.findOne({ user_Id: userid });
        if (user) {
          count = user.products.length;
          resolve(count);
        }else{
         
          resolve(count)
        }
      });
    },
    subTotal:(user)=>{
      let id=mongoose.Types.ObjectId(user);
      return new Promise(async(resolve,reject)=>{
       const amount = await cart.aggregate([
    {
        $match:{user_Id:id},
    },
    {
        $unwind:"$products",
    },
    {
      $project: {
        id: "$products.pro_Id",
        total: { $multiply: ["$products.price", "$products.quantity"] },
      },
    },
       ]);
       console.log("00000000000000000000000000000000000000000000000000")
       console.log(amount);
       let cartData= await cart.findOne({user_Id:id});
       if(cartData){
         amount.forEach(async(amt)=>{
           await cart.updateMany(
             { "products.pro_Id": amt.id},
            {$set: { "products.$.subTotal": amt.total }}
            );
         });
         resolve();
       }
      });
    },
    totalAmount:(userData)=>{
      // console.log(userData);
      const id=mongoose.Types.ObjectId(userData);
      return new Promise(async(resolve,reject)=>{
        const total=await cart.aggregate([ 
          {
            $match:{user_Id:id},
          },
          {
            $unwind:'$products',
          },
          {
            $project:{
              quantity:'$products.quantity',
              price:'$products.price'
            },
          },
          {
            $project:{
              productname:1,
              quantity:1,
              price:1,
            },
          },
          {
            $group: {
              _id:null,
              total:{ $sum: { $multiply: ['$quantity','$price']}},
            },
          },
    
        ]);
          console.log("total amount");
        if(total.length ==0){
       resolve({status:true});
        }else{
          let grandTotal=total.pop();
        resolve({grandTotal,status:true}) 
      }
      })
    
    },
    deliveryCharge:(amount)=>{
      console.log(amount+'total');
      return new Promise((resolve,reject)=>{
          if(amount>500){
            resolve(50)
          }else{
            resolve(0)
          }
      })
    },
    grandTotal:(netTotal,deliveryCharge)=>{
      return new Promise((resolve,reject)=>{
        const grandTotal=netTotal+deliveryCharge
        resolve(grandTotal)
        console.log(grandTotal);
    
      })
    },
    getCartItems: (userId) => {
      return new Promise(async (resolve, reject) => {
       let cartItem = await cart
          .findOne({ user_Id: userId })
          .populate("products.pro_Id")
          .lean();
        resolve(cartItem);
      });
    },
    changeProductQuantity:(data,user) => {
      return new Promise(async (resolve, response) => {
     const procount = parseInt(data.count);
     console.log(user);
     console.log(data);
     console.log(procount);
     console.log(data.product);
     console.log(data.cartid);
       if(procount==-1&&data.quantity==1){
         await cart.findOneAndUpdate( {user_Id: user._id},
         {
           $pull:{products:{_id:data.cartid  }}            
         }).then((response)=>{             
           resolve({removeProduct:true}) 
         })  
       }else{
         await cart.findOneAndUpdate(
           { user_Id: user._id, "products.pro_Id": data.product },
         { $inc: { "products.$.quantity": procount } 
         }).then((response)=>{
           console.log("+.............................");
           resolve(true);
         });
       }
     })
    },
    removeProductFromCart:(data,user)=>{
      return new Promise(async(resolve,reject)=>{
    await cart.findOneAndUpdate({user_Id:user._id},
      {
        $pull:{products:{_id:data.cartid }} 
      }).then((response)=>{ 
        resolve({removeProduct:true}) 
      })  
    })
    }, 
    placeOrder:(order,cartItem,grandTotal,deliveryCharge,netTotal,user)=>{
      return new Promise(async(resolve,reject)=>{       
       const status=order.paymentMethod==='cod'?'placed':'pending' 
      //  const status=order.paymentMethod==='cod'?'placed':'pending'
    
      // inserting valuesfrom body to order collection
       const orderObj=await orderModel({
         user_Id:user._id,
         Total:netTotal,
         ShippingCharge:deliveryCharge,
         grandTotal:grandTotal,
         payment_status:status, 
         paymentMethod:order.paymentMethod,
         ordered_on:new Date(),
         product:cartItem.products,
         deliveryDetails:{ 
           name:order.name, 
           number:order.number,
           email:order.email, 
           house:order.house,
          //  localplace:order.localplace,
           town:order.town,
           district:order.district,
           state:order.state,
           pincode:order.pincode
          //  name:order.fname, 
          //  number:order.number,
          //  email:order.email, 
          //  house:order.house,
          //  localplace:order.localplace,
          //  town:order.town,
          //  district:order.district,
          //  state:order.state,
          //  pincode:order.pincode     
         }    
       })
       await orderObj.save(async(err,res)=>{
        await cart.remove({user:order.userId})
         resolve(orderObj); 
       })    
    })
  },
  createRazorpay:(orderid,grandTotal)=>{  
    console.log(orderid);   
    return new Promise((resolve,reject)=>{ 
      instance.orders.create({
        amount: grandTotal*100,
        currency: "INR",
        receipt: ""+orderid            
      },
      function(err,order){
        if(err){
          console.log(err);
        }else{
          console.log("New order:",order);
          resolve(order)
        }
        
      })
    })
  },
  getorderProducts:(orderid)=>{
    console.log(orderid);
    return new Promise(async(resolve,reject)=>{
        const orderdetails=await orderModel.findOne({_id:orderid}).populate("product.pro_Id").lean()
        console.log(orderdetails);
        console.log("8888888888888888888888888888555555555555555");
        resolve(orderdetails)
    })   
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      let crypto = require("crypto");
      let hmac = crypto.createHmac('sha256',process.env.RAZORPAY_KEY)

      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        console.log("000000000000");
        resolve()
      }else{
        console.log("5555555555555555");
        reject()
      }
    })
  },
  changePayementStatus:(orderid)=>{
    return new Promise(async(resolve,reject)=>{
      
      const changestatus=await orderModel.findOneAndUpdate({_id:orderid},
        {
         $set:{payment_status:'placed'}
        }
      ).then((changestatus)=>{
        resolve(changestatus)
      })
    }) 
  },
    getAllOrderList: (userId) => {
    return new Promise(async (resolve, reject) => {
     let orderList = await orderModel
        .find({ user_Id: userId })
        .populate("product.pro_Id")
        .lean();
      resolve(orderList);
    });
  },
  addAddress:(userId,data)=>{
    return new Promise(async(resolve,reject)=>{
      const user=userData.findOne({_id:userId})
      await userData.findOneAndUpdate(
        {_id:userId},
        {
          $push: { 
            address: {
              fname:data.fname,
              lname:data.lname,
              house:data.house,
              towncity:data.towncity,
              district:data.district,
              state:data.state,
              pincode:data.pincode, 
              email:data.email,
              mobile:data.mobile
            },
          },

        })   
        resolve();
     })

    },
    userprofile:(userid)=>{
      return new Promise (async(resolve,reject)=>{
      const user=await userData.findOne({_id:userid._id}).lean()
    
        resolve(user)
     
    })
      },

    getAddresses:(user)=>{
      return new Promise(async(resolve,response)=>{
        const Addresses=await userData.findOne({_id:user}).lean()              
        // console.log(Addresses.address);
        resolve(Addresses)
      })
      }, 

      deleteAddress:(addressId,user)=>{
        return new Promise(async(resolve,reject)=>{
          const address=await userData.updateOne({_id:user._id},{$pull:{ address: { _id: addressId.cartid } }})
          resolve()
        })
      },

      editAddress:(data,userId)=>{
        return new Promise(async(resolve,reject)=>{
          const updateAddress=await userData.update({_id:userId._id},)
        })
      },
      Editproflie:(data,userId,image1)=>{
        console.log(data);
        console.log(userId);
        return new Promise(async(resolve,reject)=>{
          data.password = await bcrypt.hash(data.password, 10)
          const Editproflie=await userData.findByIdAndUpdate({_id:userId},{$set:{
            name:data.name,
            phone:data.mobile,
            image:{image1},
            email:data.email,
            password:data.password

          }})
        resolve(Editproflie)
        })
      },


      // Editproflie:(data,userId)=>{
      //   console.log(data);
      //   console.log(userId);
      //   return new Promise(async(resolve,reject)=>{
      //     data.password = await bcrypt.hash(data.password, 10)
      //     const Editproflie=await userData.findByIdAndUpdate({_id:userId},{$set:{
      //       name:data.name,
      //       phone:data.phone,
      //       password:data.password,
      //       email:data.email,
      //     }})
      //   resolve(Editproflie)
      //   })
      // },
      
  addTowishlist: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      const userdt = await wishlistmodel.findOne({ user_id: userId });
      if (userdt) {
        const proExist = userdt.products.findIndex(
          (products) => products.pro_Id == proId
        );  
        if (proExist != -1) {
          resolve({ err: "product already in wishlist" });
        } else { 
          await wishlistmodel
            .findOneAndUpdate(
              { user_id: userId },
              { $push: { products: { pro_Id: proId } } }
            )
              resolve({ msg: "added"});
        }
      } else {
        const newwishlist = new wishlistmodel({
          user_id: userId,
          products: { pro_Id: proId },
        });
        await newwishlist.save((err, result) => {
          if (err) {
            resolve({ msg: "not added to wishlist" });
          } else {
            resolve({ msg: "wislist created" });
          }
        });
      }
    });
  },
  getwishlist: (userid) => {
    return new Promise(async (resolve, reject) => {
      // console.log(userid);
      const wishlist = await wishlistmodel
        .findOne({ user_id: userid._id })
        .populate("products.pro_Id")
        .lean();
      // console.log(wishlist);
      resolve(wishlist);
    });
  }, 
  deletewishlist: (proId, user) => {
    // console.log(user);
    // console.log(proId);
    return new Promise(async (resolve, response) => {
      const remove = await wishlistmodel.updateOne(
        { user_id: user },
        { $pull: { products: { pro_Id:proId } } }
      );
      resolve({ msg: "comfirm delete" });
    });     
  }, 
  getorderProducts:(orderid)=>{
    console.log(orderid);
    return new Promise(async(resolve,reject)=>{
        const orderdetails=await orderModel.findOne({_id:orderid}).populate("product.pro_Id").lean()
        // console.log(orderdetails);
        
        resolve(orderdetails)
    })   
  },


}