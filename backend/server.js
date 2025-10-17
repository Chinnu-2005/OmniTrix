require('dotenv').config('./.env')
const connectDB=require('./db/db');

const app=require('./app');

app.listen(process.env.PORT||3000,()=>{
    console.log("Server is running......");  
})

connectDB();