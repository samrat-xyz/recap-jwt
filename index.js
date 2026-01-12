const express = require('express')
require('dotenv').config()

const port = process.env.PORT
const app = express()


app.get('/',(req,res)=>{
    res.send('server running successfully')
})


app.listen(port,()=>{
    console.log(`server running on port : ${port}`)
})
