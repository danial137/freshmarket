import express from 'express'
import cors from "cors"
import 'dotenv/config'


const PORT = 5000;
const app = express();

// middleware

app.use(cors())
app.use(express.json())

//db

// routes

app.get('/', (req, res) => {
    res.send('api working')
})

app.listen(PORT,()=> {
    console.log(`server is running on https://localhost:${PORT}`)
})