import { v2 as cloudinary } from 'cloudinary';

import fs from 'fs'

//NOTE - in file system if we delete a file then it will be unlinked and if we upload a file the it will be linked,there is no method of removing a file from the system, file can be linked or unlinked.

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnClourinary = async function (localFilePath) {
    try {
        if (!localFilePath) return console.log("Could't find the path");

        //NOTE - upload method
        const response = await cloudinary.uploader
            .upload(localFilePath,
                {
                    resource_type: "auto",
                })

        console.log("File has been uploaded on cloudinary successfully!!", response.url);

        //NOTE - cloudinary full upload response
        console.log("cloudinary upload response is - ", response);

        fs.unlinkSync(localFilePath)

        return response;
    }
    catch (error) {
        //NOTE - Remove the locally saved temporaty file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export { uploadOnClourinary };