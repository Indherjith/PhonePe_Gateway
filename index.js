const express = require("express");
const axios = require("axios");
const port = 3002;
const app = express();
const uniqid = require("uniqid");
const sha256 = require("sha256");

// testing purpose
const PHONE_PE_HOST_URL = " https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = 1;
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";

app.get("/",(req,res)=>{
    res.send("PhonePe Gateway")
});

app.get("/pay",(req,res)=>{
    const payEndpoint = "/pg/v1/pay";
    const merchantTransactionId = uniqid();
    const userId = 123;
    const payload = {
        merchantId:MERCHANT_ID,
        merchantTransactionId:merchantTransactionId,
        merchantUserId:userId,
        amount:30000,
        redirectUrl:`http://localhost:3002/redirect-url/${merchantTransactionId}`,
        redirectMode:"REDIRECT",
        mobileNumber:"9999999999",
        paymentInstrument:{
            type:"PAY_PAGE",
        },
    };

    // SHA356(base64 encoded payload + "pg/v1/pay" +salt key) + ### + salt index
    const bufferObj = Buffer.from(JSON.stringify(payload),"utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
    const xVerify = 
        sha256(base64EncodedPayload + payEndpoint + SALT_KEY) + "###" + SALT_INDEX;

    const options = {
        method:"post",
        url:`${PHONE_PE_HOST_URL}${payEndpoint}`,
        headers:{
            accept:"application/json",
            "Content_Type":"application/json",
            "X-VERIFY":xVerify
        },
        data:{
            request:base64EncodedPayload
        },
    };
    axios
        .request(options)
        .then(function(response){
            console.log(response.data);
            const url = response.data.data.instrumentResponse.redirectInfo.url;
            res.redirect(url);
            // res.send({url})
        })
        .catch(function(error){
            console.log(error);
        });
});

app.get("/redirect-url/:merchantTransactionId",(req,res)=>{
    const {merchantTransactionId} = req.params;
    if(merchantTransactionId){
        res.send({merchantTransactionId})
    }else{
        res.send({error:"Error"})
    }
})

app.listen(port,()=>{
    console.log(`App started listening on port ${port}`)
})