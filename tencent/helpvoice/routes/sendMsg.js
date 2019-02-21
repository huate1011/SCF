var router = require('express').Router();
var rp = require('request-promise');
var access_token = null;
var expiry = null;

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
    if (expiry === null || expiry > new Date()) {
        getAccessToken(req, res, next);
    } else {
        postJson(req, res, next)
    }
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
            postJson(req, res, next);
        })
        .catch(next);
};

var postJson = function (req, res, next) {
    console.log("received request to send body %s", JSON.stringify(req.body));
    var messageDemo = {
        touser: "oWlxK5GzOxVrbtWVQxIX44kqzGAI",//openId
        template_id: 'FesyGJKt_f__TRhBKKPNrHPmLFvy7C6ARN4QPqWKuVk',//模板消息id，
        page: 'pages/index/index',//点击详情时跳转的主页
        form_id: req.body.formId || "55cd127dcb4ab1c16f648b8994e1eb7",//formID
        data: {//下面的keyword*是设置的模板消息的关键词变量
            "keyword1": {
                "value": "keyword1",
                "color": "#4a4a4a"
            },
            "keyword2": {
                "value": "keyword2",
                "color": "#9b9b9b"
            },
            "keyword3": {
                "value": "keyword3",
                "color": "#9b9b9b"
            },
            "keyword4": {
                "value": "keyword4",
                "color": "#9b9b9b"
            },
            "keyword5": {
                "value": "keyword5",
                "color": "#9b9b9b"
            },
            "keyword6": {
                "value": "keyword6",
                "color": "#9b9b9b"
            },
            "keyword7": {
                "value": "keyword7",
                "color": "red"
            }
        },
        color: 'red',//颜色
        emphasis_keyword: 'keyword1.DATA'//需要着重显示的关键词
    };
    var options = {
        method: 'POST',
        uri:  'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + access_token,
        body: JSON.stringify(messageDemo),
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
};

module.exports = router;
