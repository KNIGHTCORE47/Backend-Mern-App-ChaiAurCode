import jwt from 'jsonwebtoken'
import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'

//NOTE - bcrypt is a npm package which helps to hash any password. 

//NOTE - JWT is a BEARER token means whoever bear it own it, which helps to generate tokens. It is like a key, that if anyone send it, we have to send them back the data.

//NOTE - Both 'bcrypt' and 'JWT' is based on cryptography.

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,   // NOTE - cloudinary url 
            required: true,
        },
        coverImage: {
            type: String,   // NOTE - cloudinary url 
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refereshToken: {
            type: String,
        }
    }, { timestamps: true }
)

//NOTE - Alwase remember in case of moddlewares the used flag is 'next'


//NOTE - To encrypt the password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


//NOTE - To prevent user from using the same password or re-enter the password to compare and save...
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


//NOTE - here we have use the both sessions and cookies altogaher. That is why we use both access and referesh tokens and save only the referesh tokens to the database.

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema) 