const express = require("express");
const cors = require("cors");
const UserDetail = require("./Mongo/MogoConnect.js");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const player = require('play-sound')();
const router = express.Router();
const History =require("./Mongo/HistoryModel.js");


const authenticate=require("./Mongo/Authentication.js");

// const gTTS = require("gtts");

const corsOptions = {
 origin:"https://multilanguage-translator-mern-client.vercel.app",
 //origin:"http://localhost:3000",
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

app.post("/logindata", async (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const userExist = await UserDetail.findOne({ email: email });

  if (userExist) {

    const password_cmp = await bcrypt.compare(password, userExist.password);
    console.log(userExist.name);
    if (password_cmp) {
      console.log('password matched..');
      const token = jwt.sign({ id: userExist._id, email: email, password: password,user:userExist.name }, secretkey, { expiresIn: "2h" });
     

      const expirationDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      res.cookie('token', token, {
        maxAge: 2 * 60 * 60 * 1000, // 2 hour in milliseconds
        httpOnly: true, // Ensures the cookie is accessible only by the server
        secure: true,   // Ensures the cookie is sent over HTTPS
        sameSite: 'none', // Adjust based on your cross-site requirements
    });

    res.cookie('email', email, {
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    
  });
  
      return res.json({
        msg1: "succesfully login.."
      })

    }
    else {
      return res.json({
        msg: "invalid crediantials"
      })
    }


  }



  res.json({
    msg: "user not exist please singup.."
  })
})








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
      res.status(200).json(history);
  } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
  }
});






app.listen(5000, () => {
  console.log("Server running on http://localhost:5000...");
});
