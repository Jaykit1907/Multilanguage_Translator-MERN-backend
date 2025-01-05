const jwt=require("jsonwebtoken");

const secretkey = "jaykitmaurya19072002";
const verify=(req,res,next)=>{
    const token=req.cookies.token;
    if(token){
        const verifytoken=jwt.verify(token,secretkey);
        if(verifytoken){
           
            next();
            
        }
    }


}
module.exports=verify;