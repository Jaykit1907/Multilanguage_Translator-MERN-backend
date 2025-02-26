const express = require("express");
const cors = require("cors");
const UserDetail = require("./Mongo/MogoConnect.js");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const player = require('play-sound')();
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");



const History =require("./Mongo/HistoryModel.js");


const authenticate=require("./Mongo/Authentication.js");

// const gTTS = require("gtts");

const corsOptions = {
 origin:"https://multilanguage-translator-mern-client.vercel.app",
 // origin:"http://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

const secretkey = "jaykitmaurya19072002";



app.get("/", (req, res) => {
 res.send("this is home page");
});


app.get("/translatebtn",authenticate, (req, res) => {
  

  console.log("this is home page");

  res.json({
    show:true,
    authenticated:true
  });

})

app.get("/protected",authenticate, (req, res) => {
  console.log("hi how ...");
  console.log(req.name);
  console.log(req.email);
  res.status(200).json({
      authenticated:true,
      email:req.email,
      message: "You have access to this protected route.",
      user: req.user // The decoded token can be passed if needed
  });
});


app.get("/image",authenticate, (req, res) => {
  

  console.log("this is image page");

 

  res.json({
    show:true,
    msg3:"it's me jaykit"
  });

})

app.post("/signupdata", async (req, res) => {
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const password = req.body.password;
  const cpassword = req.body.cpassword; // Make sure you're comparing password and cpassword properly
  
  console.log(req.body);

  try {
    // Check if the user already exists
    const data = await UserDetail.findOne({ email: email });
    if (data) {
      console.log("User already exists");
      return res.json({
        msg2: "User already exists, please login."
      });
    }

    // Check if password and confirm password match
    if (password !== cpassword) {
      return res.json({
        msg2: "Password and confirm password do not match."
      });
    }

    // If passwords match, hash the password
    const hashed_Password = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashed_Password);

    // Save the new user to the database
    const signUpData = new UserDetail({
      name,
      phone,
      email,
      password: hashed_Password,
      cpassword: hashed_Password // Ensure this is hashed as well
    });

    await signUpData.save();
    console.log("Data saved successfully");

    return res.json({
      msg1: "Successfully signed up."
    });
  } catch (error) {
    console.log("Error during signup:", error);
  }
});

// app.post("/logindata", async (req, res) => {

//   const email = req.body.email;
//   const password = req.body.password;
//   const userExist = await UserDetail.findOne({ email: email });

//   if (userExist) {

//     const password_cmp = await bcrypt.compare(password, userExist.password);
//     console.log(userExist.name);
//     if (password_cmp) {
//       console.log('password matched..');
//       const token = jwt.sign({ id: userExist._id, email: email, password: password,user:userExist.name }, secretkey, { expiresIn: "2h" });
     

//       const expirationDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
//       res.cookie('token', token, {
//         maxAge: 2 * 60 * 60 * 1000, // 2 hour in milliseconds
//         httpOnly: true, // Ensures the cookie is accessible only by the server
//         secure: true,   // Ensures the cookie is sent over HTTPS
//         sameSite: 'none', // Adjust based on your cross-site requirements
//     });

//     res.cookie('email', email, {
//       maxAge: 2 * 60 * 60 * 1000, // 2 hours
    
//   });
  
//       return res.json({
//         msg1: "succesfully login.."
//       })

//     }
//     else {
//       return res.json({
//         msg: "invalid crediantials"
//       })
//     }


//   }



//   res.json({
//     msg: "user not exist please singup.."
//   })
// })


app.post("/logindata", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExist = await UserDetail.findOne({ email });

    if (!userExist) {
      return res.status(404).json({ msg: "User not found, please sign up." });
    }

    const password_cmp = await bcrypt.compare(password, userExist.password);
    if (!password_cmp) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    console.log("Password matched..");

    const token = jwt.sign(
      { id: userExist._id, email, user: userExist.name },
      secretkey,
      { expiresIn: "2h" }
    );

    res.cookie("token", token, {
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ msg1: "Successfully logged in.." });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ msg: "Server error, please try again." });
  }
});






app.post('/translate', async (req, res) => {
  const { text, language1, language2, email } = req.body;

  console.log("this is",req.body);

  // Check if all required parameters are provided
  if (!text || !language1 || !language2 || !email) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log("Starting translation...");

  try {
    // Dynamically import the 'translate' module
    const translate = (await import('translate')).default; // Using dynamic import for ES module

    const translated = await translate(text, { from: language1, to: language2 });
    console.log("Translation completed");

    // Save translation history to the database
    const historyEntry = new History({
      email: email,
      searchText: text,
      translatedText: translated
    });

    try {
      const historySaved = await historyEntry.save();
     // console.log("History saved:", historySaved);
    } catch (e) {
      console.error("Error saving history:", e);
      return res.status(500).json({ error: 'Failed to save translation history' });
    }

    // Respond with the translated text and additional info
    res.json({
      message: 'Translation successful',
      originalText: text,
      translatedText: translated,
      fromLanguage: language1,
      toLanguage: language2
    });

  } catch (error) {
    console.error('Error during translation:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.get("/logout", (req, res) => {
  // Clear the token cookie (if you're using cookies)
  res.clearCookie("token");
  res.clearCookie("email");
  console.log('this is logut');

  // Respond with a success message
  res.status(200).json({ message: "Logged out successfully" });
});




app.get("/gethistory/:email", async (req, res) => {
  try {
      const { email } = req.params;
      const history = await History.find({ email }).sort({ timestamp: -1 });
    //  console.log(history);
      res.status(200).json(history);
  } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
  }
});




app.delete('/history/deleteMany', async (req, res) => {
  const { date } = req.body; // Get the date from the request body
  console.log("clicked.....");
  console.log(date);

  if(date==="delete"){
    console.log("return");
    
    try{
       const result=await History.deleteMany({});
      return res.json({ message: 'Documents deleted', deletedCount: result.deletedCount });
    }
    catch(error){
      console.error('Error deleting documents:', error);
      return res.status(500).json({ error: 'An error occurred while deleting documents' });

    }
    
  }
  
  

  try {
    // Convert the date to a range for the entire day
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Delete documents matching the date range
    const result = await History.deleteMany({
      timestamp: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    res.json({ message: 'Documents deleted', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting documents:', error);
    res.status(500).json({ error: 'An error occurred while deleting documents' });
  }
});


app.delete('/history/deleteone/:_id', async (req, res) => {
  console.log("Delete endpoint hit");
  const { _id } = req.params;

  try {
    console.log("Received ID:", _id);

    const result = await History.findByIdAndDelete(_id); // Delete the document by ID

    if (result) {
      console.log("Document deleted:", result);
      res.json({ message: 'Document deleted successfully!' });
    } else {
      res.status(404).json({ error: 'Document not found.' });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete the item.' });
  }
});




const genAI = new GoogleGenerativeAI("AIzaSyDhbbFeTTxa2HgToJsCArT7CWxcAwOe7Ps");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const processTextWithGemini = async (text, targetLang) => {
    try {
        const prompt = ` 
        1️⃣ Correct the grammar of this text: "${text}"  
        2️⃣ Then translate it into ${targetLang}.  
        3️⃣ Explain when this translated text is best used.
        4️⃣ Return the response in valid JSON format:
        {
          "corrected": "corrected sentence",
          "translated": "translated sentence",
          "when_to_use": "context or scenario for usage"
        }
        DO NOT include explanations or extra formatting.`;
        
        const result = await model.generateContent(prompt);
        let responseText = await result.response.text();

        console.log("🔍 Raw Response from Gemini:", responseText);

        responseText = responseText.replace(/```json|```/g, "").trim();

        // ✅ Validate before parsing
        if (responseText.startsWith("{") && responseText.endsWith("}")) {
            return JSON.parse(responseText);
        } else {
            throw new Error("Invalid JSON response from Gemini.");
        }
    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);
        throw new Error("Gemini API request failed.");
    }
};

app.post("/process-text", async (req, res) => {
    try {
        const { text, targetLang } = req.body;

        if (!text || !targetLang) {
            return res.status(400).json({ error: "Text and target language are required." });
        }

        console.log("Received translation request for:", text);
        console.log("Target language:", targetLang);

        const translatedText = await processTextWithGemini(text, targetLang);

        res.json(translatedText); // ✅ Returns full JSON including "when_to_use"
    } catch (error) {
        console.error("❌ Backend Error:", error.message);
        res.status(500).json({ error: "Failed to process text." });
    }
});




app.listen(5000, () => {
  console.log("Server running on http://localhost:5000...");
});
