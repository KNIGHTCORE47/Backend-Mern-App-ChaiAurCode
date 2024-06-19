// require('dotenv').config()

// NOTE - one line 1 the code structure is old and breaking the moduler code flow or if we use the method shown in the video, node will give us error regarding -r dotenv/config --exprimental-json-modules in package.json file "dev": "node ..." as node: bad option: --exprimental-json-modules that is why remove that -r dotenv/config --exprimental-json-modules part from the package.json file "dev": "node ...", use latest method import 'dotenv/config'; and not use even dotenv.config({path: './env'}).

import 'dotenv/config';
import connectDB from './db/database.js'

connectDB()

















//Approach No.02 --- Add express to the index file and ship the code along with the DataBase connection



/*
import mongoose from 'mongoose';
import express from 'express';
import { DB_NAME } from './constants.js';

const app = express();

const port = process.env.PORT || 3000;


; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error", (error) => {
            console.log("ERROR", error)
            throw error
        })

        app.listen(port, () => {
            console.log(`Local: http://localhost:${port}/`);
        })

    } catch (error) {
        console.log("ERROR", error)
        throw error
    }
})()
*/


