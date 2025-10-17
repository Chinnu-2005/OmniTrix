const mongoose=require('mongoose');
const {Schema}=mongoose;

const roomSchema=new Schema(
    {
        roomId:{
            type:String,
            required:true,
            unique:true
        },
        name:{
            type:String,
            required:true
        },
        participants:[
            {
                type:Schema.Types.ObjectId,
                ref:'User'
            }
        ],
        createdBy:{
            type:Schema.Types.ObjectId, 
            ref:'User'
        },
        updatedAt:{
            type:Date,
            default:Date.now
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
    },
    {
        timestamps:true
    }
)


module.exports=mongoose.model('Room',roomSchema);