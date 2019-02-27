var router = require('express').Router();
var rp = require('request-promise');
const util = require('util');
var AV = require('leanengine');

var Todo = AV.Object.extend('ClassA');

var access_token = null;
var expiry = null;
var endPoints = {};

const tencentcloud = require("tencentcloud-sdk-nodejs");


const AaiClient = tencentcloud.aai.v20180522.Client;
const models = tencentcloud.aai.v20180522.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

const cred = new Credential("AKIDb092f4UrCI8sSmgfJirlSu75f4FB5JWV", "tY2GK9jW4MWXOTMBmCOL2TeZLs9AwSij");
const httpProfile = new HttpProfile();
httpProfile.endpoint = "aai.tencentcloudapi.com";
const clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
const voiceClient = new AaiClient(cred, "", clientProfile);

const voiceReq = new models.SentenceRecognitionRequest();
const voiceParams = '{"ProjectId":0,"SubServiceType":2,"EngSerViceType":"8k","SourceType":0,"VoiceFormat":"mp3",' +
    '"UsrAudioKey":"www", "Url": "%s", "Version":"2018-05-22"}';


router.get('/', function(req, res, next){
    let result = JSON.stringify(req.body);
    console.log('User has result: %s', result);
    res.render('sendMsg', {
        title: 'Get Message received',
        result: result
    })
});

// 新增 Todo 项目
router.post('/', function(req, res, next) {
    if (req.body.openId === undefined || req.body.formIds === undefined) {
        res.render('Failure', {
            title: 'Missing open id or form id',
            result: ""
        });
        return;
    }
    if (expiry === null || expiry < new Date()) {
        getAccessToken(req, res, next);
    }
    let voiceUrl = req.body.voiceUrl || "http://lc-3abwy1fn.cn-n1.lcfile.com/viTUxDLEUehDFuobwWD2hLF8sI4hlYtVRmpljFEC.mp3";
    voiceReq.from_json_string(util.format(voiceParams, voiceUrl));
    console.log("Got tecent request: %s", JSON.stringify(voiceReq));
    voiceClient.SentenceRecognition(voiceReq, function(errMsg, response) {
        if (errMsg) {
            console.log(errMsg);
            return;
        }
        if (response && response.Result) {
            console.log(response.Result);
            let todo = new Todo();
            todo.set('openId', req.body.openId);
            todo.set('username', req.body.username);
            todo.set('address', req.body.address);
            todo.set('coords', req.body.coords);
            todo.set('service', req.body.service);
            todo.set('dtime', new Date());
            todo.set('accepted', "No");
            todo.save().then(function(todo) {
                console.log("Successfully saved todo: " + JSON.stringify(todo));
                while(expiry === null || expiry < new Date()) {
                }
                req.body.voiceText = response.Result;
                postJson(req, res, next);
            }).catch(next);
        }
    });

    res.render('sendMsg', {
        title: 'Post message request received',
        result: JSON.stringify(req.body)
    })
});

var getAccessToken = (req, res, next) => {
    var options = {
        uri: 'https://api.weixin.qq.com/cgi-bin/token',
        qs: {
            grant_type: 'client_credential',
            appid: 'wxc0c6d0da7a2d409d',
            secret: '1d9389c92eb2ff449e75f4c0c12636d0',
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function (response) {
            console.log('User has %s repos', JSON.stringify(response));
            access_token = response.access_token;
            expiry = new Date();
            expiry.setSeconds(expiry.getSeconds() + response.expires_in - 1000);
            var result = {"Access token": access_token, "Expiry":  expiry};
            console.log(JSON.stringify(result));
        })
        .catch(next);
};

var postJson = function (req, res, next) {
    console.log("received request to send body %s", JSON.stringify(req.body));
    let existingFormIds = endPoints[req.body.openId] || [];
    endPoints[req.body.openId] = existingFormIds.concat(typeof req.body.formIds === "string"? JSON.parse(req.body.formIds) : req.body.formIds);
    for (var key in endPoints) {
        if (!endPoints.hasOwnProperty(key) || endPoints[key].length === 0) {
            continue;
        }
        var formId = endPoints[key].pop();
        console.log("New list: ", JSON.stringify(endPoints[req.body.openId]));
        console.log("Using form id: ", formId);
        var messageDemo = {
            touser: key || "oWlxK5GzOxVrbtWVQxIX44kqzGAI",//openId
            template_id: 'FesyGJKt_f__TRhBKKPNrHPmLFvy7C6ARN4QPqWKuVk',//模板消息id，
            page: 'pages/requestHelp/requestHelp',//点击详情时跳转的主页
            form_id: formId || "55cd127dcb4ab1c16f648b8994e1eb7",//formID
            data: {//下面的keyword*是设置的模板消息的关键词变量
                "keyword1": { // name
                    "value": "keyword1",
                    "color": "#4a4a4a"
                },
                "keyword2": { // telephone
                    "value": "keyword2",
                    "color": "#9b9b9b"
                },
                "keyword3": { // address
                    "value": "keyword3",
                    "color": "#9b9b9b"
                },
                "keyword4": { // service
                    "value": req.body.voiceText,
                    "color": "#9b9b9b"
                },
                "keyword5": { // price
                    "value": "keyword5",
                    "color": "#9b9b9b"
                },
                "keyword6": { // date time
                    "value": "keyword6",
                    "color": "#9b9b9b"
                },
                "keyword7": { //comments
                    "value": "Nothing, but thanks anyway",
                    "color": "red"
                }
            }
            // color: 'red',//颜色
            // emphasis_keyword: 'keyword1.DATA'//需要着重显示的关键词
        };
        var options = {
            method: 'POST',
            uri:  'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + access_token,
            body: messageDemo,
            headers: {
                'content-type': 'application/json'
            },
            json: true // Automatically parses the JSON string in the response
        };

        rp(options)
            .then(function (response) {
                let result = JSON.stringify(response);
                console.log('User has result: %s', result);
            })
            .catch(next);
    }


};

module.exports = router;
