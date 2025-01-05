const express = require("express");
const cors = require("cors");
const UserDetail = require("./Mongo/MogoConnect.js");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const player = require('play-sound')();


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


app.get("/home",authenticate, (req, res) => {
  

  console.log("this is home page");

 

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
    if (password_cmp) {
      console.log('password matched..');
      const token = jwt.sign({ id: userExist._id, email: email, password: password }, secretkey, { expiresIn: "2h" });
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000,  // 2 hours expiration
        secure: true,  // Ensure this is set when using HTTPS
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
  const { text, language1,language2 } = req.body;
  console.log("l1.......");

  try {
    // Dynamically import the 'translate' module
    const translate = (await import('translate')).default;  // Using dynamic import for ES module

    const translated = await translate(text, {from:language1,to: language2 });
    console.log("l2....");
  //   (async () => {
  //     try {
  //         // Dynamically import 'franc'
  //         const { franc } = await import('franc'); // Accessing 'franc' function from the module
  
  //         const text1 = translated; // Example text
  //         const langCode = franc(text1); // Detect the language
  
  //         console.log(`Detected Language Code: ${langCode}`);
  //     } catch (error) {
  //         console.error("Error importing or using franc:", error);
  //     }
  // })();
  

    

// console.log(language2);
// const gtts = new gTTS(translated, language2);

// gtts.save("output.mp3", (err, result) => {
//             if (err) {
//               console.error("Error:", err);
//             } else {
//               console.log("Audio file saved as output.mp3");
//             }
//           });





// player.play('/output.mp3', function (err) {
//   if (err) console.error(`Error playing file: ${err}`);
//   else console.log('Audio finished playing');
// });

    res.json({ translatedText: translated });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});


app.get("/logout",(req,res)=>{

  res.clearCookie("token", { path: "/", httpOnly: true, secure: false });

  console.log("running logout");
  

  res.json({
    msg:"succesfully logout"
  })
})


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000...");
});
