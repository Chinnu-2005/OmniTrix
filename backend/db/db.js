const mongoose = require('mongoose');
const DB_NAME="WhiteBoardDB"

const connectDB=async()=>{
    try{
        const conn=await mongoose.connect(`${process.env.DB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected \n Host : ${conn.connection.host}`);
    }catch(err){
        console.error("Database connection error:",err);
        process.exit(1);
    }
}

module.exports=connectDB;