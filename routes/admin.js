var express = require('express');
var router = express.Router();

const adminHelpers = require("../helpers/adminHelpers");
const userHelpers = require("../helpers/userHelpers");
const storage = require("../middleware/multer");
const { response } = require('../app');
const async = require('hbs/lib/async');
const  moment = require('moment'); 


/* GET users listing. */


const verifyLogin=(req,res,next)=>{
    if(req.session.adminLogged){
        next()
    }else{
        res.redirect("/admin")
    }
}



router.get('/', function (req, res, next) {
    if (req.session.adminLogged) {

        res.redirect("/admin/adminPage")
    } else {

        res.render("admin/adminLogin", { loginPage: true, layout: "adminLayout", loggErr: req.session.loggedInError, })
    }
    req.session.loggedInError = null;
});


router.get("/adminPage", function (req, res, next) {
    if (req.session.adminLogged) {
        res.render("admin/index", { layout: 'adminLayout' })
    }

});
// router.post("/data",function(req,res,next){
//     res.render("admin/index",{layout:"adminLayout"})
// });


router.post("/data", (req, res, next) => {
    // res.header(
    //   "Cache-control",
    //   "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
    // );

    console.log(req.body);
    adminHelpers.doLogin(req.body).then((response) => {
        console.log("inside doLogin");
        if (response.admin) {
            req.session.adminLogged = true;
            req.session.admin = response.admin;
            res.redirect("/admin/adminPage")
        }// else {
        //    res.redirect("/login")
        // }
    })
        .catch((err) => {
            req.session.loggedInError = err.msg;
            res.redirect("/admin");

        });
});

router.get("/logout",verifyLogin, (req, res, next) => {
    // req.session.adminLogged = false;
    req.session.destroy(()=>{
        res.redirect("/admin")
    })
    

});



// router.get("/addProduct",(req,res,next)=>{
//     res.render("admin/addProduct",{layout:'adminLayout'})
// });

router.get("/userData",verifyLogin,(req,res)=>{
    adminHelpers.getAllusers().then((userData)=>{
        res.render("admin/userData",{layout:"adminLayout",userData})
    })
    
});

router.get("/addCategory",verifyLogin,(req,res,next)=>{
    adminHelpers.getCategories().then((allCategory)=>{
        res.render("admin/addCategory",{allCategory, layout:'adminLayout',
        err1:req.session.categoryExistErr,
        err2:req.session.subcategoryExitsErr
     }) ;
     req.session.categoryExistErr=null
     req.session.subcategoryExitsErr=null   
    });

    
});


router.post("/category",(req,res)=>{
    adminHelpers.addCategory(req.body).then((response)=>{
        console.log(response);
        res.redirect("/admin/addCategory");
    })
    .catch((err)=>{
        req.session.categoryExistErr = err.msg
        res.redirect("/admin/addcategory");
        console.log(err);
    });
});

router.post("/subcategory",(req,res)=>{
    adminHelpers.addSubcategory(req.body).then((response)=>{
        console.log(response);
        res.redirect("/admin/addcategory");
    })
    .catch((err)=>{
        req.session.subcategoryExitsErr=err.msg
        res.redirect("/admin/addcategory");
        console.log(err);
    });
});
router.post("/addProduct",storage.fields([
    {name:"image1",MaxCount:1}
]),
(req,res)=>{
    console.log(req.body);
    console.log(req.files);
    const img1 = req.files.image1[0].filename;
    console.log(img1);

    adminHelpers.addProduct(req.body,img1).then((response)=>{
        console.log(response);
        req.flash("msg","Product Added Successfully");
        res.redirect("/admin/addProduct");
    })
}
);

router.get("/addProduct",verifyLogin,async(req,res)=>{
    const category= await adminHelpers.getCategories();
    const subcategory= await adminHelpers.getSubcategories();
    console.log(category+"\n"+subcategory);
    res.render("admin/addProduct",{
        category,
        subcategory,
        layout:"adminLayout"
    });
});
router.get("/viewproducts",verifyLogin,async(req,res)=>{
    // res.render("admin/viewProducts",{layout:"adminLayout"})
    const products = await adminHelpers.getProducts();
    const categories =await adminHelpers.getCategories();
    const subcategories = await adminHelpers.getSubcategories();
    console.log(products);
    const alert = req.flash("msg");
    res.render("admin/viewProducts",{
        alert,
        products,
        categories,
        subcategories,
        layout:"adminLayout"

    });

});
router.get("/deleteProduct/:id",verifyLogin, (req, res) => {
    const proId = req.params.id;
    console.log("log1: " + proId);
    adminHelpers.deleteProduct(proId).then((response) => {
      req.session.removedProduct = response;
      req.flash("msg", "Product Deleted..!");
      res.redirect("/admin/viewProducts");
    });
    console.log(proId);
});
router.get("/add-product",verifyLogin,(req,res)=>{
    res.redirect("/admin/addProduct")
});
router.get("/add-category",verifyLogin,(req,res)=>{
    res.redirect("/admin/addCategory")
});


router.get("/edit-products/:id",verifyLogin, async (req,res)=>{
    const product = await adminHelpers.getoneProduct(req.params.id);
    console.log('get products');
    console.log(product._id);
    const categories = await adminHelpers.getCategories();
    const subcategories =await adminHelpers.getSubcategories();
    res.render("admin/editProduct",{
        layout:"adminLayout",
        product,
        categories,
        subcategories
    });

});

router.post("/edit-products/:id",storage.fields([
    {name:"image1",MaxCount:1}
]),
(req,res)=>{
    console.log(req.body);
    console.log(req.files);
    const proId = req.params.id
    const img1 = req.files.image1?req.files.image1[0].filename:req.body.image1;
    console.log(img1);

    adminHelpers.editProducts(req.body,proId,img1).then((response)=>{
        console.log("Response: "+response);
        req.flash("msg","The Product is Edited")
        res.redirect("/admin/viewproducts")
    })
}
);
router.get("/Blockuser/:id",verifyLogin,(req,res)=>{
    const proId = req.params.id;
    console.log(proId);
    console.log("-----------------");
    adminHelpers.blockUser(proId).then((response)=>{
        res.json({status:true})
       
    });
});

router.get("/UnBlockuser/:id",verifyLogin,(req,res)=>{
    const proId = req.params.id;
    console.log(".............");
    adminHelpers.unBlockUser(proId).then((response)=>{
        res.json({status:true})
    });
});
router.get("/addCoupon",(req,res)=>{
    res.render("admin/addCoupon",{layout:"adminLayout"})
});
router.get("/viewCoupon",(req,res)=>{
    adminHelpers.getAllCoupons(req.body).then((response) => {
        const AllCoupons = response;
        res.render("admin/viewCoupon",{layout:"adminLayout", AllCoupons})
      });
    
});
router.post("/add-Coupon",(req,res)=>{
       
        adminHelpers.AddCoupon(req.body).then(()=>{
            res.redirect("/admin/viewCoupon")
        });
    
    
   
});

router.get("/deleteCoupons/:id",(req,res)=>{ 
    console.log("************") 
    console.log(req.params.id)  
   
    adminHelpers.deleteCoupon(req.params.id).then((response)=>{ 
      console.log("1000000000001") 
      res.redirect("/admin/viewCoupon") 
    }) 
 
});


router.get("/order", (req, res) => {
    adminHelpers.allorders().then((response) => {
      const allorders = response;
      allorders.forEach((element) => {
        element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
      });
      res.render("admin/orderview", { layout:"adminLayout", allorders });
    });
  });
  router.get("/viewOrderProducts/:id", (req, res) => {
    adminHelpers.orderdetails(req.params.id).then((response) => {
      const order = response;
      const ordered_on = moment(order.ordered_on).format("MMM Do YY");
      res.render("admin/orderdetails", { ordered_on,  order, layout:"adminLayout"});
    });
  });

  router.post('/changeOrderStatus',(req,res)=>{
    console.log('inside change')
    adminHelpers.changeOrderStatus(req.body).then((response)=>{
      res.redirect('/admin/order')
    })
  })

  router.post("/getData", async (req, res) => {
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });
    adminHelpers.salesReport(req.body).then((data) => {
      // let pendingAmount = data.pendingAmount;
      let salesReport = data.salesReport;
      let brandReport = data.brandReport;
      // let orderCount = data.orderCount;
      // let totalAmountPaid = data.totalAmountPaid;
      // let totalAmountRefund = data.totalAmountRefund;
       console.log(month._id)
      let dateArray = [];
      let totalArray = [];
      salesReport.forEach((s) => {
        dateArray.push(`${month}-${s._id} `);
        totalArray.push(s.total);
      });
      console.log(salesReport)
      let brandArray = [];
      let sumArray = [];
      brandReport.forEach((s) => {
        brandArray.push(s._id);
        sumArray.push(s.totalAmount);
      });
      res.json({
        // totalAmountRefund,
        dateArray,
        totalArray,
        brandArray,
        sumArray,
        // orderCount,
        // totalAmountPaid,
        // pendingAmount,
      });
    });
  });



module.exports = router;
