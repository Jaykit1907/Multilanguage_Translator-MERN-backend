const mongoose=require("mongoose");

mongoose.connect("mongodb://localhost:27017/Translator1").then(()=>{
    console.log("Mongodb connected successfully...")
}).catch((err)=>{
    console.log("error at mongodb",err);
})


// mongoose.connect("mongodb+srv://jaykit1907:NLeC4KaUBDCFaPYh@cluster0.h1mdt.mongodb.net/jaykit1?retryWrites=true&w=majority&appName=Cluster0")
// .then(()=>{console.log("connected successfulllly.....")}).catch((err)=>{console.log("error",err)});


const Schema1=new mongoose.Schema({
    name:{
        type:String,
        lowercase:true,
    },
    phone:{
        type:Number
        
    },
    email:{
        type:String,
    },

    password:{
        type:String
    },
    cpassword:{
        type:String
    }
})

module.exports =new mongoose.model("Translator",Schema1);