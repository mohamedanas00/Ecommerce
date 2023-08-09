import { Schema, model } from "mongoose";

const subcategorySchema = Schema({
    name: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        minlength: [2, 'too short category name'],
        trim: true//delte space from first and end
    },
    slug: {
        type: String,
        lowercase: true,
    },
    image: {
        secure_url: String,
        public_id: String,
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true, //{TODO}convert to true after creating 
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        required: false, //{TODO}convert to true after creating 
    }
},
    {
        timestamps: true,
    }
)


const subcategoryModel = model('SubCategory', subcategorySchema)

export default subcategoryModel