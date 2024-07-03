import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { uploadOnClourinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(
    async function (req, res) {
        // NOTE - Step01 => get user detailes from frontend
        //NOTE - Step02 => Validation primarily - not empty field
        //NOTE - Step03 => check if user already exist: check using - username, email
        //NOTE - Step04 => check for images, check for avatar
        //NOTE - Step05 => if Step04 is available upload them to cloudinary, check avatar uploaded from multer
        //NOTE - Step06 => create an user object to store it in mongoDB cause mongoDB is a noSQL database, create entry in DB.
        //NOTE - Step07 => remove password and refresh token field from response
        //NOTE - Step08 => check for user creation
        //NOTE - Step09 => return res



        // NOTE - here we can not directly handle files but data
        // NOTE - to hanlde files we have to use routes and middlewares

        
        const { username, email, fullName, password } = req.body
        console.log("email: ", email);

        if (
            [username, email, fullName, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All filds are required")
        }

        if (!email == email?.includes("@")) {
            throw new ApiError(400, "Invalid email format")
        }

        //NOTE - Operators
        const existedUser = await User.findOne({
            $or: [{ email }, { username }]
        })

        if (existedUser) {
            throw new ApiError(409, "email or username already exists")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required")
        }

        const avatar = await uploadOnClourinary(avatarLocalPath);
        const coverImage = await uploadOnClourinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar image is required")
        }

        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refereshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        )
    }
)

export { registerUser }