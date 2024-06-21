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

export { app } 