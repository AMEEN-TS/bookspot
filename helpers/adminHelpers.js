const db=require("../config/connections");
const adminData=require("../models/admin");
const nodeMailer=require("nodemailer");
const userData = require("../models/user");
const bcrypt=require("bcrypt");
const categories = require("../models/category");
const subcategories = require("../models/subCategory");
const productData =require("../models/productData")
const async = require("hbs/lib/async");
const { reject, promise } = require("bcrypt/promises");
const res = require("express/lib/response");
const couponmodel = require("../models/Coupon");
const orderModel = require("../models/order");



module.exports={

    doLogin: (adminData1) => {
        console.log(adminData1);
        return new Promise(async (resolve, reject) => {
          let loginStatus = false;
          let response = {};
          let admin = await adminData.findOne({ email: adminData1.email });
          // let admin= await adminData.findOne({email:userDataaa.email})
          // console.log(userData);
          // console.log(user.email);
    
          if (admin) {
            
            console.log(admin);
            
            console.log(adminData1.password);
            console.log(admin.password);
            bcrypt.compare(adminData1.password, admin.password).then((status) => {
              if (status) {
                console.log("Login Success!");
                response.admin =admin;
                response.status = true;
                resolve(response);
                console.log(response + "1234");
              } else {
                console.log("Login Failed");
                reject({ status: false, msg: "Password not matching!" });
              }
            });
          } else {
            console.log("Login Failed");
            reject({ status: false, msg: "Email not registered, please sign up!" });
          }
        });
      },

      addCategory:(categoryData)=>{
        return new Promise(async(resolve,reject)=>{
          const categoryName = categoryData.category;
          console.log(categoryName);

          const categoryexist = await categories.findOne({category:categoryName,});
          if (categoryexist){
            reject({status: false,msg:"Entered Category already exists!"});
          }else{
            const addCategories = await new categories({
              category: categoryName,
            });
            await addCategories.save(async(err, result)=>{
              if(err){
                reject({msg:"Category can't be added"});

              }else{
                resolve({ result,msg:"New Category Added"})
              }
            });
          }
        });
      },
      getCategories: ()=>{
        return new Promise(async(resolve,reject)=>{
          console.log("helperssssssss")
          const allCategory = await categories.find().lean();
          console.log(allCategory)
          resolve(allCategory);
          
        });
      },

      addSubcategory:(subcategoryData)=>{
        return new Promise(async(resolve,reject)=>{
          const subcategoryName = subcategoryData.subcategory;
          console.log(subcategoryData);

          const subcategoryFind  = await subcategories.findOne({
            subcategory:subcategoryName,
          });
          const categoryFind = await categories.findOne({
            category:subcategoryData.category,
          });
          if(subcategoryFind){
            reject({status:false,msg:"Entered Subcategory already exist"});
          }else{
            const addSubcategories = await new subcategories({
              subcategory:subcategoryName,
              category:categoryFind._id,
            });
            await addSubcategories.save(async(err,result)=>{
              if(err){
                reject({msg:"Subcategory can't be added"});
              }else{
                resolve({result,msg:"New Subcategory Added"});
              }
            });

          }
        });
      },

      getSubcategories:()=>{
        return new Promise(async(resolve,reject)=>{
          const allSubCategory = await subcategories.find({}).lean();
          resolve(allSubCategory);
        });
      },
      
      addProduct:( data, image1)=>{
        return new Promise (async (resolve,reject)=>{
          const subcategoryData = await subcategories.findOne({
            subcategory:data.subcategory,
          });
          const categoryData =await categories.findOne({
            category:data.category,
            
          });

          console.log("subcategory:"+subcategoryData);
          console.log("category123:"+categoryData);

          if(!image1){
            reject({msg:"upload image"});
          }else{
            const newProduct = await productData({
              productname:data.productname,
              author:data.author,
              publisher:data.publisher,
              binding:data.binding,
              pages:data.pages,
              language:data.language,
              price:data.price,
              discount:data.discount,
              stock:data.stock,
              description:data.price,
              category:categoryData._id,
              subcategory:subcategoryData._id,
              image:{image1},

            });
            await newProduct.save(async(err,result)=>{
              if(err){
                reject({msg:"product can't be added"});
              }else{
                resolve({ data: result, msg: "Product Added Successfully" });
              }
            });
          }

        });
      },
     getProducts:()=>{
      return new Promise(async(resolve,reject)=>{
        const allProducts = await productData.find({}).populate("category").populate("subcategory").lean()
        resolve(allProducts);
      });
     },
     deleteProduct: (proId) => {
      console.log("log2: " + proId);
      return new Promise(async (resolve, reject) => {
        let productId = proId;
        const removedProduct = await productData.findByIdAndDelete({
          _id: productId,
        });
        
        resolve(removedProduct);
      });
    },

    getoneProduct: (data) => {
      return new Promise(async (resolve, reject) => {
        const theProduct = await productData.findOne({_id:data}).lean();
        resolve(theProduct);
      });
    },
    editProducts:(data,proId,image1)=>{
      return new Promise(async(resolve,reject)=>{
        console.log("edit products");
        const subcategoryData = await subcategories.findOne({
          _id:data.subcategory
        });
        const categoryData = await categories.findOne({
          _id:data.category
        });
        console.log(categoryData);
        const updateProduct= await productData.findByIdAndUpdate(
          {_id:proId},
          {
            $set:{
              productname:data.productname,
              author:data.author,
              publisher:data.publisher,
              binding:data.binding,
              pages:data.pages,
              language:data.language,
              price:data.price,
              discount:data.discount,
              stock:data.stock,
              description:data.description,
              category:categoryData._id,
              subcategory:subcategoryData._id,
              image:{image1},
            },
          }
        );resolve({updateProduct,msg:"The Product is Edited"})
      });
    },
    getAllusers:()=>{
      return new Promise (async(resolve,reject)=>{
        const users = await userData.find().lean();
        resolve(users);
      });
    },

    blockUser: (userId) => {
      console.log(userId);
      return new Promise(async (resolve, reject) => {
        const user = await userData.findByIdAndUpdate(
          { _id: userId },
          { $set: { block: true } },
          { upsert: true }
        );
        resolve(user);
      });
    },
    
    unBlockUser: (userId) => {
      return new Promise(async (resolve, reject) => {
        const user = await userData.findByIdAndUpdate(
          { _id: userId },
          { $set: { block: false } },
          { upsert: true }
        );
        resolve(user);
      });
    },

    AddCoupon: (data) => {
      return new Promise(async (resolve, reject) => {
        const newCoupon = new couponmodel({
          couponName: data.CouponName,
          couponCode: data.CouponCode,
          limit: data.limit,
          expirationTime: data.expirydate,
          discount: data.discount,
        });
        await newCoupon.save();
        resolve();
      });
    },
    getAllCoupons: () => {
      return new Promise(async (resolve, reject) => {
        const AllCoupons = await couponmodel.find({}).lean();
        resolve(AllCoupons);
      });
    },
    deleteCoupon:(proId)=>{ 
      return new Promise(async(resolve,reject)=>{ 
        console.log("222222222222222") 
        const removecoupon= await couponmodel.findByIdAndDelete({_id:proId}) 
        resolve(removecoupon) 
      }) 
    },

    allorders: () => {
      return new Promise(async (resolve, reject) => {
        const allorders = await orderModel
          .find({})
          .populate("product.pro_Id")
          .sort({ _id: -1 })
          .lean();
        resolve(allorders);
      });
    },

    orderdetails: (orderID) => {
      return new Promise(async (resolve, reject) => {
        const orderdetails = await orderModel
          .findOne({ _id: orderID })
          .populate("product.pro_Id")
          .lean();
        resolve(orderdetails);
      });
    },

    changeOrderStatus: (data) => {
      console.log(data);
      return new Promise(async (resolve, reject) => {
        const state = await orderModel.findOneAndUpdate(
          { _id: data.orderId, "product._id": data.proId },
          {
            $set: {
              "product.$.status": data.orderStatus,
            },
          }
        );
        console.log(state, "state");
  
        resolve();
      }).catch((err) => {
        console.log(err, "errrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
      });
    },
    salesReport: (data) => {
      let response = {};
      let { startDate, endDate } = data;
      let d1, d2, text;
      if (!startDate || !endDate) {
        d1 = new Date();
        d1.setDate(d1.getDate() - 7);
        d2 = new Date();
        text = "For the Last 7 days";
      } else {
        d1 = new Date(startDate);
        d2 = new Date(endDate);
        text = `Between ${startDate} and ${endDate}`;
      }
      const date = new Date(Date.now());
      const month = date.toLocaleString("default", { month: "long" });
      return new Promise(async (resolve, reject) => {
        let salesReport = await orderModel.aggregate([
          {
            $match: {
              ordered_on: {
                $lt: d2,
                $gte: d1,
              },
            },
          },
          {
            $match: { payment_status: "placed" },
          },
          {
            $group: {
              _id: { $dayOfMonth: "$ordered_on" },
              total: { $sum: "$grandTotal" },
            },
          },
        ]);
        let brandReport = await orderModel.aggregate([
          {
            $match: { payment_status: "placed" },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              brand: "$product.productName",
              quantity: "$product.quantity",
            },
          },
    
          {
            $group: {
              _id: "$brand",
              totalAmount: { $sum: "$quantity" },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 5 },
        ]);
        // let orderCount = await ordermodel
        //   .find({ date: { $gt: d1, $lt: d2 } })
        //   .count();
        // let totalAmounts = await orderModel.aggregate([
        //   {
        //     $match: { payment_status: "placed" },
        //   },
        //   {
        //     $group: {
        //       _id: null,
        //       totalAmount: { $sum: "$grandTotal" },
        //     },
        //   },
        // ]);
        // let totalAmountRefund = await orderModel.aggregate([
        //   {
        //     $match: { status: "Order placed" },
        //   },
        //   {
        //     $group: {
        //       _id: null,
        //       totalAmount: { $sum: "$reFund" },
        //     },
        //   },
        // ]);
        response.salesReport = salesReport;
        response.brandReport = brandReport;
        // response.orderCount = orderCount;
        // response.totalAmountPaid = totalAmounts.totalAmount;
        // response.totalAmountRefund = totalAmountRefund.totalAmount;
        resolve(response);
      });
    },

};