const jwt=require("jsonwebtoken");
const express=require("express");
const cookieParser = require("cookie-parser");
const app=express();
app.use(cookieParser());

const secretkey = "jaykitmaurya19072002";
const verify=(req,res,next)=>{
    const token=req.cookies.token;
    if(token){
        const verifytoken=jwt.verify(token,secretkey);
        if(verifytoken){
            console.log("this is token");


            console.log(verifytoken);

            req.user=verifytoken.user;
            req.email=verifytoken.email;
            
           
            next();
            
        }
    }
    else{
        console.log("token not found11");
        return res.json({
            authenticated:false,
            msg:"please login first"
        })
        
        
        
    }


}
module.exports=verify;