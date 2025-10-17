const mongoose = require('mongoose');
const { Schema } = mongoose;

const boardSchema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        // Store drawing elements/strokes
        elements: [
            {
                type: {
                    type: String,
                    enum: ['path', 'line', 'rectangle', 'circle', 'text', 'eraser'],
                    required: true
                },
                // Path data for freehand drawing
                path: {
                    type: String, // SVG path string or serialized coordinates
                },
                // Coordinates for shapes
                coordinates: {
                    x: Number,
                    y: Number,
                    width: Number,
                    height: Number,
                    x2: Number, // For lines
                    y2: Number  // For lines
                },
                // Styling properties
                strokeColor: {
                    type: String,
                    default: '#000000'
                },
                fillColor: {
                    type: String,
                    default: 'transparent'
                },
                strokeWidth: {
                    type: Number,
                    default: 2
                },
                opacity: {
                    type: Number,
                    default: 1,
                    min: 0,
                    max: 1
                },
                // For text elements
                text: {
                    type: String
                },
                fontSize: {
                    type: Number,
                    default: 16
                },
                fontFamily: {
                    type: String,
                    default: 'Arial'
                },
                // Metadata
                createdBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                },
                // For tracking element updates/deletions
                isDeleted: {
                    type: Boolean,
                    default: false
                },
                deletedAt: {
                    type: Date
                },
                deletedBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User'
                },
                // Z-index for layering
                zIndex: {
                    type: Number,
                    default: 0
                }
            }
        ],
        // Canvas settings
        canvasSettings: {
            backgroundColor: {
                type: String,
                default: '#ffffff'
            },
            width: {
                type: Number,
                default: 1920
            },
            height: {
                type: Number,
                default: 1080
            },
            gridEnabled: {
                type: Boolean,
                default: false
            }
        },
        // Version tracking for conflict resolution
        version: {
            type: Number,
            default: 0
        },
        // Last modified info
        lastModifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// Index for faster queries
boardSchema.index({ roomId: 1 });
boardSchema.index({ 'elements.createdBy': 1 });

// Method to add a new element
boardSchema.methods.addElement = function(elementData) {
    this.elements.push(elementData);
    this.version += 1;
    return this.save();
};

// Method to delete an element (soft delete)
boardSchema.methods.deleteElement = function(elementIndex, userId) {
    if (this.elements[elementIndex]) {
        this.elements[elementIndex].isDeleted = true;
        this.elements[elementIndex].deletedAt = new Date();
        this.elements[elementIndex].deletedBy = userId;
        this.version += 1;
        return this.save();
    }
    return Promise.reject(new Error('Element not found'));
};

// Method to clear all elements
boardSchema.methods.clearBoard = function(userId) {
    this.elements = [];
    this.version += 1;
    this.lastModifiedBy = userId;
    return this.save();
};

// Static method to get board by roomId
boardSchema.statics.getByRoomId = function(roomId) {
    return this.findOne({ roomId }).populate('lastModifiedBy', 'username avatar');
};

module.exports = mongoose.model('Board', boardSchema);