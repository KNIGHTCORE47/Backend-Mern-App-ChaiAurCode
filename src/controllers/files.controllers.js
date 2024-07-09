import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { uploadOnClourinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const updateUserAvatar = asyncHandler(
    async function (req, res) {

        const avatarLocalPath = req.file?.path

        if(!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing")
        }

        const avatar = await uploadOnClourinary(avatarLocalPath)

        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading avatar")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password ")

        return res.status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
    }
)

const updateUserCoverImage = asyncHandler(
    async function (req, res) {

        const coverImageLocalPath = req.file?.path

        if(!coverImageLocalPath) {
            throw new ApiError(400, "Cover image file is missing")
        }

        const coverImage = await uploadOnClourinary(coverImageLocalPath)

        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading coverImage")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {new: true}
        ).select("-password ")

        return res.status(200)
        .json(new ApiResponse(200, user, "Cover imgage updated successfully"))
    }
)

export {
    updateUserAvatar,
    updateUserCoverImage
}