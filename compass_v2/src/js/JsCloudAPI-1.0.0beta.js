if(!window.JsCloudAPI){
    //simulate JsCloudAPI
    (function(){
        var serviceMap = {},
            AbstractService = function(){};

        AbstractService.prototype.action = function(action, func){
            this[action] = func;
            return this;
        };
        window.JsCloudAPI = {
            simulate: function(pkg){
                var api = serviceMap[pkg];
                if(api){
                    return api;
                }
                serviceMap[pkg] = api = new AbstractService();
                return api;
            },
            init: function(pkg){
                return serviceMap[pkg];
            }
        }

    })();


/*
 ---------------Telephony---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Telephony").
/*
 打电话
 @method startCall
 */
action("startCall", function(phone){
    console.log("[simulate] Telephony.call phone: " + phone);
});
/*
 ---------------Multimedia---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Multimedia").
/*
 从图库中选择图片
 @method pickImage
 */
action("pickImage", function(type, success){
    console.log("[simulate] pickImage" );
    var f = eval(success);
    f("image_local_url");
}).
/*
 从Camera选择图片
 @method takePhoto
 */
action("takePhoto", function(type, success){
    console.log("[simulate] takePhoto" );
    var f = eval(success);
    f("image_local_url");
}).
/*
 上传图片
 @method uploadImage
 */
action("uploadImage", function(url, success){
    console.log("[simulate] uploadImage");
    var f = eval(success);
    f("image_local_url");
}).
/*
 下载图片
 @method downloadImage
 */
action("downloadImage", function(url, success){
    console.log("[simulate] downloadImage: " + url);
    var f = eval(success);
    f("image_local_url");
}).
/*
 设置壁纸
 @method setAsWallpaper
 */
action("setAsWallpaper", function(url, success){
    console.log("[simulate] setAsWallpaper: " + url);
    var f = eval(success);
    f("wallpaper_local_url");
}).
/*
 下载铃声
 @method setAsWallpaper
 */
action("downloadRington", function(url, success){
    console.log("[simulate] downloadRington: " + url);
    var f = eval(success);
    f("ringto_local_url");

}).
/*
 设置铃声
 @method setAsRington
 */
action("setAsRington", function(url, success){
    console.log("[simulate] setAsRington: " + url);
    var f = eval(success);
    f("ringto_local_url");
}).
/*
 播放视频
 @method playVideo
 */
action("playVideo", function(url, success){
     console.log("[simulate] playVideo: " + url);
     var f = eval(success);
     f();
});

/*
 ---------------Utility---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Utility").
/*
 弹出toast提示
 @method toast
 */
action("toast", function(message){
    console.log("[simulate] toast: " + message);
}).
/*
 打开浏览器
 @method openBrowser
 */
action("openBrowser", function(url){
    console.log("[simulate] openBrowser: " + url);
    window.open(url);
}).
/*
 包装成同域的ajax请求
 @method openBrowser
 */
action("wrapAjaxUrl", function(url){
    console.log("[simulate] wrapAjaxUrl: " + url);
    return "__cache" + url;
});
/*
 ---------------Messaging---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Messaging").
/*
 发送短信
 @method startSms
 */
action("startSms", function(phone, sms){
    console.log("[simulate] phone: " + phone + " | sms: " + sms);
});
/*
 ---------------PIM---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.PIM").
/*
 从服务器取sign
 @method getSign
 */
action("getSign", function(flag, success, fail){
     console.log("[simulate] sign:");
}).
/*
 从缓存中取sign
 @method peekSign
 */
action("peekSign", function(success, fail){
    console.log("[simulate] sign:");
}).
/*
 绑定淘宝账号
 @method bindTaobao
 */
action("bindTaobao", function(success){
    console.log("[simulate] bindTaobao:");
    var f = eval(success);
    f("true");
}).
/*
 获取CloudUUID
 @method getCloudUUID
 */
action("getCloudUUID", function(){
    console.log("[simulate] getCloudUUID:");
    return 'clouduuid';
}).
/*
 获取名片信息
 @method getBusinessCard
 */
action("getBusinessCard", function(){
    console.log("[simulate] getBusinessCard:");
    return JSON.stringify({  
                  "id":"1",
                  "phoneNumbers":  [{"value":"XXXXXXXXXX","type":"mobile"}],
                  "addresses":[{"streetAddress":"紫荆花路2号联合大厦",
                      "region":"浙江","locality":"杭 州",
                      "postalCode":"310000","type":"work","country":"中国"}],
                  "displayName":"XXX",
                  "organizations":[{"title":"工程师","name":"阿里巴巴"}]});
}).
/*
 获取用户信息
 @method getUserInfo
 */
action("getUserInfo", function(flag, success, fail){
    console.log("[simulate] getUserInfo");
    var f = eval(success);
    f(JSON.stringify({
        KP: '12345',
        NICKNAME: 'nickname'
    }));
});
/*
 ---------------Device---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Device").
/*
 获取DeviceId
 @method getDeviceId
 */
action("getDeviceId", function(){
    console.log("[simulate] getDeviceId");
    return 'deviceid';
}).
action("scanBarCode", function(title, success){
    console.log("[simulate] scanBarCode title: " + title);
    var f = eval(success);
    f("bar_code");
}).
action("getNetworkType", function(success){
    console.log("[simulate] Device getNetworkType");
    var f = eval(success);
    f("NETWORK_TYPE_CDMA");
}).
/*
 获取方位
 @method getCurrentHeading
 */
action("getCurrentHeading", function(){
    console.log("[simulate] getCurrentHeading");
    return 45;
}).
/*
 启动云应用
 @method launchApplication
 */
action("launchApplication", function(info){
    console.log("[simulate] Device.launchApplication: " + info); 
});
/*
 ---------------DeviceStateInfo---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.DeviceStateInfo").
action("getCurrentPosition", function(success){
    console.log("[simulate] getCurrentPosition");
    var func = eval(success)
    func(JSON.stringify({
        coords:{
            latitude: 1234,
            longitude: 2345,
            accuracy: 'accuracy',
            city: '杭州'
        }
     }));
}).
action("isNetworkAvailable", function(){
    console.log("[simulate] isNetworkAvailable");
    return navigator.onLine ? 'true' : 'false';
}).
action("wirelessSetting", function(){
    console.log("[simulate] wireless settings");
}).
action("getNetworkInfo", function(){
    console.log("[simulate] DeviceStateInfo getNetworkInfo");
    return 'wifi';
});
/*
 ---------------Contacts---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.common.Contacts").
action("peekEmail", function(success){
    console.log("[simulate] peekEmail");
    var f = eval(success);
    f("李磊,lilei@gmail.com,lilei@126.com");
}).
action("peekPhoneNumber", function(success){
    console.log("[simulate] peekPhoneNumber");
    var f = eval(success);
    f("李磊,13578659876,13486669876");
});
/*
 ---------------KeyManager---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.keymanager.KeyManager").
/*
 获取应用的启动参数
 @method getArguments
 */
action("setTouchArea", function(x, y, w, h){
    console.log("[simulate] setTouchArea x: %s y: %s w: %s, h: %s", x, y, w, h);
});

/*
 ---------------ApplicationLauncher---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.application.ApplicationLauncher").
action("launchApplication", function(info){
    console.log("[simulate] ApplicationLauncher.launchApplication:" + info);
});
/*
 ---------------ApplicationManager---------------
 */
JsCloudAPI.simulate("com.aliyun.cloudapp.api.application.ApplicationManager").
/*
 获取应用的启动参数
 @method getArguments
 */
action("getArguments", function(){
    console.log("[simulate] getArguments");
    return 'application startupinfo';
}).
/*
 得到应用的安装信息
 @method getApplicationInfo
 */
action("getApplicationInfo", function(info, success){
    console.log("[simulate] getApplicationInfo: " + info);
    var obj = JSON.parse(info);
    var f = eval(success);
    if(obj.type == 'NATIVEAPP'){
        f(JSON.stringify({
          status: "downloaded"
       }));
    }else{
        f(JSON.stringify({
           IsShortcutCreated  : true,
           IsOnScreen : true
        }));
    }
}).
/*
 退出云应用
 @method exitApplication
 */
action("exitApplication", function(){
    console.log("[simulate] exitApplication");
}).
/*
 获取桌面屏幕应用
 @method getScreenApplications
 */
action("getScreenApplications", function(){
    console.log("[simulate] getScreenApplications: " + info);
    return JSON.stringify([{"screenId":-3, "id":'cloudappstore.mobile.aliyun.com/queqiao/manifest/id/921', "locked":true, "iconPath": "..."}]);
}).
/*
 操作应用到桌面或7屏
 @method operateApplication
 */
action("operateApplication", function(info, action, success){
    console.log("[simulate] operateApplication: " + info);
    var f = eval(success);
    f(JSON.stringify({
        opCode: 'ADD_TO_SCREEN',
        id: '921'
    }));
}).
/*
 告知底层框架关于云应用框架的信息，传递硬键回调函数
 @method setApplicationFrameworkCapability
 */
action("setApplicationFrameworkCapability", function(){
    console.log("[simulate] setApplicationFrameworkCapability");
});

////////////////////end////////////////////////
};
///////////////////////////////////////////////