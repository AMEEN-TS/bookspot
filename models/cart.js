const mongoose=require('mongoose')
const cartSchema = new mongoose.Schema({
    user_Id:{type:mongoose.Schema.Types.ObjectId,
        ref:'user'},
        total:{type:Number,default:0},
    products:[{
        pro_Id:{type:mongoose.Schema.Types.ObjectId,
        ref:'product'},
        price:{type:Number},
        quantity:{type:Number,default: 1},
        subTotal:{type:Number,default:0}   
}]
    
})
const cart= mongoose.model('cart',cartSchema)
module.exports=cart