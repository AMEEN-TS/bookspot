const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema= new Schema({
    productname:String,
    author:String,
    publisher:String,
    binding:String,
    pages:String,
    language:String,
    price:String,
    discount:String,
    stock:String,
    description:String,
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    subcategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "subcategory",
        required: true
    },
    image:{
        type:Array,
    },
    created_at: { type: Date, required: true, default: Date.now }

}, { timestamps: true })
const product = mongoose.model('product', productSchema)
module.exports = product