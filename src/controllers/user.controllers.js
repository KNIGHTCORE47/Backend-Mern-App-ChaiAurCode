import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { uploadOnClourinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async function (userId) {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        //NOTE - here if we perform the save method in database the models of mongoose kick in like required the password field too but here we just update the field with one value that is why we use anothere parameter
        await user.save({ validateBeforeSave: true })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

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

        //NOTE - how data fetched into req.body
        console.log("All the parsed data into body", req.body);

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

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required")
        }

        const avatar = await uploadOnClourinary(avatarLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar image is required")
        }

        //NOTE - here we will face a simple javaScript error that is if user forget to upload a coverImge it will give us error of undefined instead of null
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        //NOTE - classic method to resolve this problem
        let coverImageLocalPath;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }

        const coverImage = await uploadOnClourinary(coverImageLocalPath);

        //NOTE - how data fetched into req.files
        console.log("All the parsed files data", req.files || error);

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

const loginUser = asyncHandler(
    async function (req, res) {
        //NOTE - step01 => get data from req body
        //NOTE - step02 => email or password
        //NOTE - step03 => find the user
        //NOTE - step04 => check password(if ok then step05 else throw error)
        //NOTE - step05 => give access and refresh token
        //NOTE - step06 => send the tokens by secure cookies and give a success response 



        const { username, email, password } = req.body
        console.log("username", username);
        console.log("email", email);
        console.log("password", password);

        //NOTE - Check wheather the user send usernme or email
        if (!(username || email)) {
            throw new ApiError(400, "username or email is required")
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        //NOTE - if there is no existing user found
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }

        //NOTE - if there is a existing user found, check password 
        //NOTE - here we have to use the lowercase user and not the capitalize User cause incase of User it is derived from mongoose, a mongoose object
        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user password")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        //NOTE - OPTIONAL Step(cause it require DB power and more costly)

        const loggedInUser = await User.findById(user._id).select("-password, -refreshToken")

        //NOTE - Method of sending cookies
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken,
                    },
                    "User Logged In Successfully"
                )
            )
    }
)

const logoutUser = asyncHandler(
    async function (req, res) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out"))
    }
)

/*NOTE - disscuss over => AccessToken and RefreshToken 

Working method - restrict user from give user details like email and password over and over again to access fetures of the web app or website by creating a tokenise method which kept both within the server and user end

AccessToken - it is a short lived token system, after expiry of it user has to re-enter their email and password to refresh that token again.

RefreshToken - it is also known as Session Storge, kept within the server side as well as user side. Suppose in the user end the accessToken invalidates, it will give 401 statusCode message that is the access of the website is expired. In that case at the frontend we can give user an endpoint to hit to refresh the accessToken and receive that new accessToken which will incorporate with a new refereshToken. As we all know that refereshToken is also saved within the server side as well so in backend both user side and server side refereshToken will be compaired and if matched the sessions starts again which is similar to login. At that time emptied cookies will be filled with accessToken as well as a new refreshToken too.
*/

const refreshAccessToken = asyncHandler(
    async function (req, res) {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

            const user = await User.findById(decodedToken?._id)

            if (!user) {
                throw new ApiError(401, "Invalid refresh token")
            }

            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used")
            }

            const options = {
                httpOnly: true,
                secure: true,
            }

            const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

            return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {
                            accessToken,
                            refreshToken: newRefreshToken,

                        },
                        "Access Token Refreshed Successfully"
                    )
                )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }
    }
)

const changeCurrentPassword = asyncHandler(
    async function (req, res) {
        const { oldPassword, newPassword, confirmPassword } = req.body

        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invlid password")
        }

        if (newPassword !== confirmPassword && confirmPassword == "") {
            throw new ApiError(400, "Password must be same")

        }

        user.password = newPassword     //NOTE - only set the value
        await user.save({ validateBeforeSave: false })     //NOTE - completely save the value

        return res.status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))

    }
)

const getCurrentUser = asyncHandler(
    function (req, res) {
        return res.status(200)
            .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
    }
)

const updateAccountDetails = asyncHandler(
    async function (req, res) {

        const { fullName, email } = req.body

        if (!(fullName || email)) {
            throw new ApiError(400, "All fields are required")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName: fullName,
                    email: email
                }
            },
            { new: true }
        ).select("-password")

        return res.status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
    }
)

const getUserChannelProfile = asyncHandler(
    async function (req, res) {
        const { username } = req.params

        if (!username?.trim()) {
            throw new ApiError(400, "username is missing")
        }

        //NOTE - Alwase remember using mongoDB aggrigtion pipeline it alwase returns a array of object where the index zero is the applicble one.

        const channel = await User.aggregate(
            [
                {
                    $match: {
                        username: username?.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribedTo"
                    }
                },
                {
                    $addFields: {
                        subscribersCount: {
                            $size: "$subscribers"
                        },
                        channelsSubscribedToCount: {
                            $size: "$subscribedTo"
                        },
                        isSubscribed: {
                            $cond: {
                                if: {
                                    $in: [req.user?._id, "$subscribers.subscriber"]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        subscribersCount: 1,
                        channelsSubscribedToCount: 1,
                        isSubscribed: 1,
                        avatar: 1,
                        coverImage: 1,
                        email: 1
                    }
                }
            ]
        )

        console.log("mongoDB aggrigation pipeline returned value", channel);

        if (!channel.length) {
            throw new ApiError(404, "Channel does not exists")
        }

        return res.status(200)
        .json(new ApiError(200, channel[0], "User channel fetched successfully"))

    }
)

const getWatchHistory = asyncHandler(
    async function (req, res) {
        //req.user._id    //NOTE - interview question => In mongoDB we will get _id value as a string and not mongoDB _id, behind the sceane the mongoose is responsible to convert this sting value into the mongoDB _id so that we can perform the methods like - findById, findByOne etc.

        //NOTE - Mongodb aggrigation pipeline does not dependent over mongoose to work so incase we have to use the mongoDB aggrigation pipeline we have to convert the _id string value through mongoose objectId and can not directly propagate req.user._id to the value.

        const user = await User.aggregate([
            {
                $match: {
                    _id: new monooge.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner", 
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ])

        return res.status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
    }
)

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    getUserChannelProfile,
    getWatchHistory
}