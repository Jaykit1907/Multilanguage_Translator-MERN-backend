const mongoose = require("mongoose");


mongoose.connect("mongodb://localhost:27017/Translator1").then(()=>{
    console.log("connected history successfully...");
}).catch((err)=>{
    console.log("error at mongodb",err);
})





// mongoose.connect("mongodb+srv://jaykit1907:NLeC4KaUBDCFaPYh@cluster0.h1mdt.mongodb.net/jaykit1?retryWrites=true&w=majority&appName=Cluster0")
// .then(()=>{console.log("connected history successfulllly.....")}).catch((err)=>{console.log("error",err)});

const historySchema = new mongoose.Schema({
    email: { type: String, required: true },
    searchText: { type: String, required: true },
    translatedText: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const History = mongoose.model("History", historySchema);
module.exports = History;
