const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatSchema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        messageType: {
            type: String,
            enum: ['text', 'system'],
            default: 'text'
        }
    },
    {
        timestamps: true
    }
);

chatSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);