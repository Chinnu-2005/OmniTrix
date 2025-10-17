const express=require('express');
const cors=require('cors');
const cookieparser=require('cookie-parser');



const app=express();

app.use(express.json())
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieparser());

//include routes

app.use('/api/auth',require('./routes/user.routes'));



module.exports=app