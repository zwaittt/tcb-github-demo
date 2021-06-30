'use strict';
const { ads10 }  = require('./actions');

exports.main = async (event, context) => {
    console.log(event);
    const result = {
        code: 0,
        message: 'sccuess',
    };
    // VOD 回调发送的数据
    const reqBody = JSON.parse(event.body || "{}");
    try {
        switch (reqBody.EventType) {
            case 'NewFileUpload': 
                const fileId = reqBody.FileUploadEvent.FileId;
                console.log('---- file uplaod ----');
                console.log(fileId);
                const res = await ads10(fileId);
                console.log('---- process succed ----');
                console.log(res);
                result.response = res;
                break;
            default: ;
        }
        
    } catch(e) {
        result.code = -1;
        result.message = 'api error';
        console.log('---- api error ----');
        console.log(e);
    }
    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {"Content-Type":"application/json; charset=utf-8"},
        "body": JSON.stringify(result)
    }
};