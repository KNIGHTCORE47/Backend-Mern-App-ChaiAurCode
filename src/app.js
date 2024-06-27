import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


//NOTE - accept form-data as json format
app.use(express.json({limit: "16kb"}))

//NOTE - accept url data and parse it into a encoded form so that express will distinguish spaces and other staffs.
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//NOTE - to keep the assets like fabicon images etc.
app.use(express.static("public"))

//NOTE - to accept cookies from user and store that data on the user browser securely and use it to perform CRUD operation.
app.use(cookieParser())






//NOTE - import routes

import userRouter from './routes/user.routes.js'

//NOTE - routes declaration => here we can not use app.get() method cause we have seperated the routes from the app.js, that is why here we have to use a middleware to get access of the routes. Here wewill use app.use() method to access the routes.

app.use("/api/v1/users", userRouter)

//OUTCOME as - http://localhost:8000/api/v1/users/register


export { app } 