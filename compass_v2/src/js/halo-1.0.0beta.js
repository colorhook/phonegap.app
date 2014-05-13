/*!
 * Copyright aliyun.com All rights reserved.
 * @version 1.0.0beta
 */
;(function(){

var require,
    define;

(function () {
    var modules = {};

    function build(module) {
        var factory = module.factory;
        module.exports = {};
        delete module.factory;
        factory(require, module.exports, module);
        return module.exports;
    }

    //引入模块
    require = function (id) {
        if (!modules[id]) {
            throw 'module ' + id + ' not found';
        }
        return modules[id].factory ? build(modules[id]) : modules[id].exports;
    };

    //定义模块
    define = function (id, factory) {
        if (modules[id]) {
            throw 'module ' + id + ' already defined';
        }
        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

})();
define('halo', function (require, exports, module) {

    /**
    @module halo
    **/

    //判断当前运行环境是否在手机上
    function isMobile() {
        var platform = window.navigator.platform.toLowerCase();
        return !!(~platform.indexOf('linux') && ~platform.indexOf('arm'));
    }

    //创建一个事件
    function createEvent(type, data, eventType) {
        var event = document.createEvent((eventType || 'Events'));
        event.initEvent(type, false, false);
        if (data) {
            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    event[i] = data[i];
                }
            }
        }
        return event;
    }

    //遍历某个对象的属性
    function each(objects, func, context) {
        for (var prop in objects) {
            if (objects.hasOwnProperty(prop)) {
                func.apply(context, [objects[prop], prop]);
            }
        }
    }

    //覆盖某个对象的某个属性
    function overwirte(host, key, obj) {
        try {
            host[key] = obj;
        } catch (err) {}

        if (host[key] !== obj) {
            host.__defineGetter__(key, function () {
                return obj;
            });
        }
    }

    var halo,
    
    /*
    通过meta头判断是否输出log信息，debug默认是关闭的，使用如下的方式可以打开debug。
    
    <meta name='halo' debug='1'/>
    <meta name='halo' debug='ok'/>
    <meta name='halo' debug='yes'/>
    <meta name='halo' debug='true'/>
    */
    _logFlag = (function(){
        var result = false,
        meta = document.querySelectorAll('meta[name=halo]');
        for(var i = 0, l = meta.length; i < l; i++){
            var debug = meta[i].getAttribute('debug');
            if(debug){
                result = !!debug.match(/^(yes|1|ok|true)$/i);
            }
        }
        return result;
    })(),
    EMPTY = function () {},
    API_VERSION = 0,
        API_PKG_NAMES = [{ //7-28版本
            'android': 'com.aliyun.cloudapi.android.',
            'common': 'com.aliyun.cloudapi.common.',
            'personal': 'com.aliyun.cloudapi.personal.'
        }, { //9-15版本
            'android': 'com.aliyun.cloudapp.api.android.',
            'common': 'com.aliyun.cloudapp.api.common.',
            'personal': 'com.aliyun.cloudapp.api.personal.'
        }, { //12-20版本
            'android': 'com.aliyun.cloudapp.api.android.',
            'common': 'com.aliyun.cloudapp.api.common.',
            'personal': 'com.aliyun.cloudapp.api.personal.',
            'keymanager': 'com.aliyun.cloudapp.api.keymanager.',
            'application': 'com.aliyun.cloudapp.api.application.'
        }],
        API_LIST = [
            [1, 'Telephony', 'common', 'Telephony'],
            [1, 'Messaging', 'common', 'Messaging'],
            [1, 'Device', 'common', 'Device'],
            [1, 'DeviceStateInfo', 'common', 'DeviceStateInfo'],
            [1, 'PIM', 'common', 'PIM'],
            [1, 'Multimedia', 'common', 'Multimedia'],
            [1, 'Enviroment', 'common', 'Enviroment'],
            [1, 'Utility', 'common', 'Utility'],
            [1, 'File', 'common', 'FileUtility'],
            [1, 'HitArea', 'common', 'HitArea'],
            [1, 'Alipay', 'personal', 'Alipay'],
            [2, 'Contacts', 'common', 'Contacts'],
            [2, 'Payment', 'personal', 'Payment'],
            [3, 'AliyunPay', 'personal', 'AliyunPay'],
            [3, 'KeyManager', 'keymanager', 'KeyManager'],
            [3, 'ApplicationLauncher', 'application', 'ApplicationLauncher'],
            [3, 'ApplicationManager', 'application', 'ApplicationManager']
        ],
        API_CACHE = {},
        getAPIInfoByName = function (name) {
            for (var i = 0, l = API_LIST.length; i < l; i++) {
                if (name == API_LIST[i][1]) {
                    return API_LIST[i];
                }
            }
            return null;
        },
        /*
        根据package来创建CloudAPI
        @param fullpkg {String} CloudAPI的包名
        */
        createAPIHost = function (fullpkg) {
            var host;
            try {
                host = window.JsCloudAPI.init(fullpkg);
            } catch (err) {}
            return host;
        },
        /*
        通过名称获得CloudAPI对象
        @method getAPI
        @param name {String} API对象的简短名称
        */
        getAPI = function (name) {
            var info, host, pkg;
            if (API_CACHE[name] !== undefined) {
                return API_CACHE[name];
            }
            info = getAPIInfoByName(name);
            if (API_VERSION >= info[0]) {
                pkg = API_PKG_NAMES[API_VERSION - 1][info[2]];
                host = createAPIHost(pkg + name);
                if (host) {
                    API_CACHE[name] = host;
                }
                return host;
            }
            return undefined;
        },
        //检测CloudAPI的版本
        detectAPIVersion = function () {
            if (API_VERSION !== 0) {
                return;
            }
            var orderList = [
                [3, 'application', 'ApplicationLauncher'],
                [2, 'personal', 'Payment'],
                [1, 'common', 'Device']
            ],
                i = 0,
                l = orderList.length,
                host,
                item,
                pkg;

            for (; i < l; i++) {
                item = orderList[i];
                pkg = API_PKG_NAMES[item[0] - 1][item[1]] + item[2];
                host = createAPIHost(pkg);
                if (host) {
                    API_VERSION = item[0];
                    return;
                }
            }
        },
        //创建插件，通过插件获取一些系统信息
        getSystemInfoByPlugin = function () {
            var sys, el;

            if (API_VERSION == 3 && ('ontouchstart' in window)) {
                el = document.createElement('object');
                el.id = 'halo_yunos_plugin';
                el.type = 'application/x-device-api';
                el.style.cssText = 'position:absolute;width:10px;height:10px;top:-100px;';
                document.body.appendChild(el);
                sys = el.system;
                if (sys) {
                    try {
                        sys.platform.FrameworkVersion = this.version;
                    } catch (ex) {
                        halo.log(ex);
                    }
                } else {
                    el.parentNode.removeChild(el);
                }
            } else {
                halo.log('plugin not supported');
            }
            return sys;
        },
        systemInfo,
        /*
        修正平台相关的信息
        @method getPlatform
        @return {Object} 平台相关的信息
        */
        _fixSystemInfo = function () {
            var k,
            sfv,
            sfv_code,
            platform = systemInfo.platform,
                fixedPlatform = {},
                frameWorkVersion = {
                    '7801': 'W700',
                    '7802': 'W800',
                    '5912': '5912A',
                    '5913': '5913',
                    '5915': '5915',
                    '7809': '7809',
                    '7810': '7810',
                    '7811': '7811',
                    '7812': '7812'
                },
                keys = {
                    FrameworkVersion: 1,
                    JavascriptVMVersion: 1,
                    SystemFrameworkVersion: 1,
                    NativeFrameworkVersion: 1,
                    CaHostVersion: 1,
                    KernelVersion: 1,
                    WebkitVersion: 1,
                    FirmwareVersion: 1,
                    BandVersion: 1,
                    APIVersion: 1,
                    Locale: 1,
                    HardwarePlatform: 1,
                    Model: 1
                };

            for (k in keys) {
                fixedPlatform[k] = platform[k];
            }
            sfv = fixedPlatform.SystemFrameworkVersion;
            sfv_code = sfv.split('.')[2];
            if (!fixedPlatform.Model) {
                fixedPlatform.Model = frameWorkVersion[sfv_code] ? frameWorkVersion[sfv_code] : 'W700';
            }
            //修正SystemFrameworkVersion
            if (sfv == '0.0.9.0') {
                if (API_VERSION == 1) {
                    fixedPlatform.SystemFrameworkVersion = '0.0.7.0';
                }
            } else if (sfv.match(/0\.1\.\d+\.0/)) {
                fixedPlatform.SystemFrameworkVersion = '0.1.0.0';
            }
            //修正语言大小写
            if (fixedPlatform.Locale) {
                fixedPlatform.Locale = fixedPlatform.Locale.replace(/\-\w+/, function (s) {
                    return s.toUpperCase();
                });
            }

            var _systemInfo = systemInfo;

            systemInfo = {
                get: function () {
                    _systemInfo.get.apply(_systemInfo, arguments);
                },
                platform: fixedPlatform
            };
        },
        /*
        获得系统相关的信息

        @method getSystem
        @return {Object} 系统信息
        */
        getSystemInfo = function () {
            if (systemInfo) {
                return systemInfo;
            }
            var defaultSystemInfo = {
                platform: {
                    FrameworkVersion: this.version,
                    JavascriptVMVersion: 'v8_1.0.0',
                    SystemFrameworkVersion: '0.0.9.0',
                    NativeFrameworkVersion: '2.3.4',
                    CaHostVersion: '0.1.0',
                    KernelVersion: '',
                    WebkitVersion: '',
                    FirmwareVersion: '',
                    BandVersion: '',
                    APIVersion: '0.5.0',
                    Locale: 'zh-CN',
                    HardwarePlatform: 'phone'
                },
                get: function (propertyId, successCallback, errorCallback, options) {
                    switch (propertyId) {
                    case 'OutputDevices':
                        successCallback({
                            'displayDevices': [{
                                'dotsPerInchW': 160.42105,
                                'dotsPerInchH': 160,
                                'physicalWidth': 480,
                                'physicalHeight': 800,
                                'orientation': 0,
                                'brightness': 142,
                                'contrast': null,
                                'blanked': null,
                                'info': null
                            }],
                            'printingDevices': [{
                                'type': null,
                                'resolution': null,
                                'color': null,
                                'info': null
                            }],
                            'brailleDevices': [{
                                'nbCells': null,
                                'info': null
                            }],
                            'audioDevices': [{
                                'type': null,
                                'freqRangeLow': null,
                                'freqRangeHigh': null,
                                'volumnLevel': null,
                                'info': null
                            }]
                        });
                        break;
                    }
                }
            };
            systemInfo = getSystemInfoByPlugin() || defaultSystemInfo;
            _fixSystemInfo();

            return systemInfo;
        };
    /**
    全局的halo对象是一个包装了云OS API的底层对象，通过包装，可以得到更易用的接口。
    
    halo的一部分调试信息默认是不输出的，如果要查看这些信息，需要在HTML中通过设置meta头信息开启他们，比如：

        <meta name='halo' debug='1'/>
        <meta name='halo' debug='ok'/>
        <meta name='halo' debug='yes'/>
        <meta name='halo' debug='true'/>
    

    一段示例代码：
    
        //渲染列表
        var renderList = function(list){
            var tpl = $('#shop-list-tpl').html(),
                shopList = $('#shop-list');
            shopList.append(Mustache.to_html(tpl, list));

            //当列表被点击时，根据被点击项执行不同的动作
            shopList.delegate('li', 'tap', function(e){
                var target = $(this),
                    type = target.data('type'),
                    data = target.data('data'),
                    param = target.data('param');

                switch(type){
                    //启动应用
                    case 'cloud':
                        navigator.app.startCloudApplication({id: data, data: param}); break;
                    case 'native':
                        navigator.app.startNativeApplication({'package': data, data: param}); break;
                    case 'url':
                        navigator.app.browse(data); break;
                    case 'video':
                        navigator.app.playVideo(data); break;
                    case 'phone':
                        navigator.app.dial(data); break;
                    case 'message':
                        navigator.app.sms(data, param); break;

                    //获取定位
                    case 'geolocation':
                        navigator.geolocation.getCurrentPosition(function(data){
                            navigator.notification.toast('latitude: %s longitude: %s',
                                data.coords.latitude, data.coords.longitude); 
                        }, function(){
                            navigator.notification.toast('未能定位成功');
                        });
                        break;
                    
                    //获取用户的登录sign
                    case 'sign':
                        navigator.pim.getSign(function(sign){
                            navigator.notification.toast(sign);
                        }, function(){
                            navigator.notification.toast('未能获得用户的sign');
                        });
                        break;

                    //获取设备信息
                    case 'name':
                        navigator.notification.toast(device.name); break;
                    case 'uuid':
                        navigator.notification.toast(device.uuid); break;
                    case 'deviceId':
                        navigator.notification.toast(device.deviceId); break;
                    case 'version':
                        navigator.notification.toast(device.version); break;
                }
            });
        }
        window.onload = function(){
            if(navigator.network.connection.onLine){
                $.jsonp('http://www.your-domain.com/service/list/', function(list){
                    localStorage.setItem('list', JSON.stringify(list));
                    renderList(list);
                });
            }else{
                var list = localStorage.getItem('list');
                if(list){
                    renderList(JSON.parse(list));
                }else{
                    navigator.notification.toast('请检查网络');
                }
            }
        }

    @class halo
    @static
    **/
    halo = {

        /**
        halo的版本号
        @property version
        @type {String}
        @readOnly

        @example
            
            console.log(halo.version);

        **/
        version: '1.0.0beta',
        
        /**
        当前的运行环境是否是mobile
        @property mobile
        @type {Boolean}
        @readOnly
        @example
            
            if(halo.mobile){
                console.log("当前的运行环境是手机");
            }
        **/
        mobile: isMobile(),

        /**
        定义一个模块
        @method define
        @param {String} name 模块的名称
        @param {Function} function 模块的功能
        @example
            
            halo.define("halo/plugin/greeting", function(require, exports, module){
                module.exports.say = function(){
                    console.log("hello, halo");
                }
            });
            var greeting = halo.require("halo/plugin/greeting");
            greeting.say();  //output: hello, halo
        **/
        define: define,

        /**
        引用一个模块
        @method require
        @param {String} name 模块的名称
        @return {Object} 模块对象
        @see  halo.require
        @example
            
            halo.define("halo/plugin/greeting", function(require, exports, module){
                module.exports.say = function(){
                    console.log("hello, halo");
                }
            });
            var greeting = halo.require("halo/plugin/greeting");
            greeting.say();  //output: hello, halo
        **/
        require: require,


        /**
        打印日志
        @method log
        @param {String} msg 需要打印的日志
        @example
            
            halo.log("Yes, I can see U.");  //output: [Halo] Yes, I can see U.
        **/
        log: function (msg) {
            if (window.console && console.log && _logFlag) {
                console.log('[Halo] ' + msg);
            }
        },
        /**
        向某个对象上注入其它一些对象
        @method inject
        @param {Object} objects 注入的描述文件
        @param {Object} parent 注入到的对象
        @example

            halo.build({
                obj1: {
                    path: 'halo/namespace/obj1'
                },
                obj2: {
                    path: 'halo/namespace/obj2',
                    pattern: 'overwrite'
                },
                obj3: {
                    path: 'halo/namespace/obj3',
                    pattern: 'merge',
                    children: {
                        obj4: {
                            path: 'halo/namespace/obj4'
                        }
                    }
                }
            }, navigator);

        **/
        inject: function (objects, parent) {
            parent = parent || window;
            each(objects, function (value, key) {
                if (value.path) {
                    var pattern = value.pattern,
                        obj = require(value.path);

                    if (!parent[key]) {
                        parent[key] = obj;
                    } else {
                        if (pattern == 'overwrite') {
                            overwirte(parent, key, obj)
                        } else if (pattern == 'merge') {
                            for (var i in obj) {
                                if (!parent[key][i]) {
                                    overwirte(parent[key], i, obj[i]);
                                }
                            }
                        }
                    }
                }

                if (value.children) {
                    if (!parent[key]) {
                        parent[key] = {};
                    }
                    halo.inject(value.children, parent[key]);
                }
            });
        },
        /**
        在window上触发一个自定义事件
        @method fireWindowEvent
        @protected
        @param {String} event 事件的类型
        @param {Object} data 事件的数据
        @example

            window.addEventListener('halo_event', function(event){
                console.log(event.type);
            }, false);
            halo.fireWindowEvent('halo_event');
        **/
        fireWindowEvent: function (event, data) {
            window.dispatchEvent(createEvent(event, data));
        },
        /**
        在document上触发一个自定义事件
        @method fireDocumentEvent
        @protected
        @param {String} event 事件的类型
        @param {Object} data 事件的数据
        @example

            document.addEventListener('halo_event', function(event){
                console.log(event.type);
            }, false);
            halo.fireDocumentEvent('halo_event');
        **/
        fireDocumentEvent: function (event, data) {
            document.dispatchEvent(createEvent(event, data));
        },

        //callback机制
        callbackId: 0,
        callbacks: {},

        /**
        通过回调函数创建一个适用于传递给CloudAPI的uuid
        @method createCallback
        @param func {Function}
        @return {String} 回调函数的uuid
        @example
            
            //获取地理定位成功的回调函数
            var success = halo.createCallback(function(data){
                console.log(data);
            });
            //获取地理定位失败的回调函数
            var fail = halo.createCallback(function(err){
                console.log(err);
            });
            //获取地理定位
            halo.exec("DeviceStateInfo", "getCurrentPosition", [success, fail]);
        **/
        createCallback: function (func) {
            var callback = 'callback' + this.callbackId++,
                callbackName = 'halo.callbacks.' + callback;

            this.callbacks[callback] = func || EMPTY;
            return callbackName;
        },
        /**
        执行CloudAPI的某个方法
        @method exec
        @param service {String} CloudAPI的简短名称
        @param action {String} CloudAPI的方法名称
        @param args {Array|undefined} CloudAPI需要接受的参数
        @see halo.createCallback
        **/
        exec: function (service, action, args) {
            var api = getAPI(service);
            if (!api) {
                throw 'Cloud API ' + service + ' not found'
            }
            if (!api[action]) {
                throw 'method ' + action + ' not found on Cloud API ' + service;
            }
            return api[action].apply(api, args);
        },
        /**
        获得系统相关的信息

        @method getSystemInfo
        @return {Object} 系统信息
        @example
            
            var info = halo.getSystemInfo();
            console.log("检测到的手机型号是：" + info.platform.Model);
        **/
        getSystemInfo: function () {
            return getSystemInfo();
        }
    };

    //初始化CloudAPI
    (function () {
        /**
        CloudAPI的内部版本，1表示20110915版本，2表示20111120版本，3表示之后的版本。
        @property _internalCode
        @private
        @type {Int}
        @readOnly
        **/
        detectAPIVersion();
        halo._internalCode = API_VERSION;
        //在window上绑定resume, pause, reset事件
        var deviceEvents = ['resume', 'pause', 'reset'],
            capitalize = function (s) {
                if (!s) {
                    return s;
                }
                return s.charAt(0).toUpperCase() + s.substr(1);
            };
        //手机硬键或系统的回调函数，这个函数只能命名为caf_handleEvent. shit.
        window.caf_handleEvent = function (type) {
            halo.log('Halo hardware callback: ' + type);
            var name = type;
            if (type === 'home') {
                name = 'reset';
            }
            if (name === 'reset' || name === 'back') {
                name += 'button';
            }
            halo.fireDocumentEvent(name);
        };

        deviceEvents.forEach(function(type){
            var wType = 'on' + capitalize(type);
            window[wType] = function () {
                halo.log('Halo window event callback: ' + type);
                halo.fireDocumentEvent(type);
            }
        });


        try {
            var args = [JSON.stringify({
                'systemFramework': 'halo',
                'version': halo.version,
                'handleHardwareKey': 'caf_handleEvent'
            }), halo.createCallback(), halo.createCallback()];
            halo.exec('ApplicationManager', 'setApplicationFrameworkCapability', args);
        } catch (err) {
            halo.log(err);
        }
    })();

    module.exports = halo;

});
define('halo/plugin/app', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    
    /**
    app对象有拥有很多和系统交互的能力，可以用它来启动云应用或者本地应用。在跨域请求上，它也提供了解决方案。
        
        var app = navigator.app;

        //启动参数
        console.log(app.arguments);

        //启动浏览器浏览网页
        app.browse("http://www.aliyun.com");

        //将跨域地址转换成同域地址
        app.wrapAjaxUrl("http://www.taobao.com");

        //设置Touch区域
        app.setTouchArea(0, 0, 480, 800);


    @class app
    @static
    @namespace navigator
    **/
    var args,
        Device = 'Device',
        Utility = 'Utility',
        Telephony = 'Telephony',
        Messaging = 'Messaging',
        Multimedia = 'Multimedia',
        APP_MANAGER = 'ApplicationManager',
        APP_LAUNCHER = 'ApplicationLauncher',
        KEY_MANAGER = 'KeyManager';

    module.exports = {
        
        /**
        自动检测OS版本，获得一个正确的云应用uuid。
        云应用的uuid自20110728开始经历了3个版本：
        >1. services `cloudappstore.mobile.aliyun.com/services/manifest/id/921`
        >2. queqiao `cloudappstore.mobile.aliyun.com/queqiao/manifest/id/921`
        >3. 32位字符串(加上3个分隔符后是35位) `7eed1772-f56b-22c8-d27fda355cbe8207`
        @method _fixuuid
        @param {String} id 云应用的uuid
        @private
        **/
        _fixuuid: function(id){
            id = String(id);
            if(/^\w+\-\w+\-\w+\-\w+~?$/.test(id)){
                return id;
            }
            if(id.indexOf('cloudappstore.mobile.aliyun.com') == -1){
                id = 'cloudappstore.mobile.aliyun.com/queqiao/manifest/id/' + id;
            }
            if(halo._internalCode == 1){
                id = id.replace(/queqiao/, 'services');
            }
            return id;
        },
        
        /**
        扫描二维码，调用该接口会切换到扫描界面。
        @method scan
        @param {String} title 扫描界面中显示的标题文字
        @param {Function} success 扫描成功的回调函数
        @param {Function} fail 扫描失败的回调函数
        @example 
            
            navigator.scan("正在扫描...", function(code){
                console.log("bar code is: %s", code);
            });
        **/
        scan: function(title, success, fail){
            var args = [title, halo.createCallback(success), halo.createCallback(fail)];
            return halo.exec(Device, 'scanBarCode', args);
        },
        /**
        设置touch区域，touch区域是一个矩形区域。桌面7屏的云应用左右滑动时会相互切换。
        为了在一个云应用里面支持左右滑动的手势，就要设置一个封闭的touch区域，在这个区域里面
        左右滑动不会在应用间切换。

        @method setTouchArea
        @param {Number} x touch区域左上角的x坐标
        @param {Number} y touch区域左上角的y坐标
        @param {Number} w touch区域的宽带
        @param {Number} h touch区域的高度
        @example
            
            //设置touch区域
            navigator.app.setTouchArea(0, 0, 480, 800);
            
            //清除touch区域
            navigator.app.setTouchArea(0, 0, 0, 0);
        **/
        setTouchArea: function(x, y, w, h){
            return halo.exec(KEY_MANAGER, 'setTouchArea', [x, y, w, h]);
        },
        /**
        包装ajax请求，将地址变成一个同域的地址，避免出现跨域问题。
        @method wrapAjaxUrl
        @param {String} url 要包装的URL
        @return {String} 包装后的URL
        @example
            var url = 'http://www.my-cross-domain/service/';
            $.get(navigator.app.wrapAjaxUrl(url), function(response){
                console.log(response);
            });
        **/
        wrapAjaxUrl: function(url){
            return halo.exec(Utility, 'wrapAjaxUrl', [url]);
        },
        /**
        打开浏览器。传递一个URL参数，在云应用中可以打开浏览器。
        @method browse
        @param {String} url 需要在浏览器中打开的URL
        @example
            
            $("#btn").tap(function(){
                navigator.app.browse("http://www.aliyun.com");
            });
        **/
        browse: function(url){
            return halo.exec(Utility, 'openBrowser', [url]);
        },
        /**
        调用至拨号界面。
        @method dial
        @param {String} number 需要拨打的对方号码
        @example
            
            $("#btn").tap(function(){
                navigator.app.dial("85022600");
            });
        **/
        dial: function(number){
            return halo.exec(Telephony, 'startCall', [String(number)]);
        },
        /**
        调用至短信界面
        @method sms
        @param {String} number 需要发送的对方号码
        @param {String} message 发送的内容
        @example
            
            $("#btn").tap(function(){
                navigator.app.sms("13*********", "下雨啦，快收衣服呀");
            });
        **/
        sms: function(number, message){
            return halo.exec(Messaging, 'startSms', [String(number), message]);
        },
        /**
        上传图片到服务器
        @method uploadImage
        @param {String} server 服务器接收地址
        @param {Function} sucess 上传成功的回调
        @param {Function} fail 上传失败的回调
        @param {Function} process 上传过程中的进度回调
        @param {String} mode 是否显示下载模态窗口
        @param {Int} quality 上传的质量，默认为-1，不压缩
        @example
            
            var server = 'http://my-domain.com/upload-server/';
            navigator.app.uploadImage(server, function(){
                console.log('upload success');
            });
        **/
        uploadImage: function(server, success, fail, process, mode, quality){
            if(quality == null){
                quality = -1;
            }
            var args = [server,
                        halo.createCallback(success), 
                        halo.createCallback(fail),
                        halo.createCallback(proccess),
                        mode,
                        quality];

            return halo.exec(Multimedia, 'uploadImage', args);
        },
        /**
        下载图片
        @method downloadImage
        @param {String} url 图片地址
        @param {Function} sucess 下载成功的回调
        @param {Function} fail 下载失败的回调
        @param {Function} process 下载过程中的进度回调
        @param {String} mode 是否显示下载模态窗口
        @example
            
            var url = 'http://bbs.aliyun.com/images/wind85/logo.png';
            navigator.app.downloadImage(url, function(){
                console.log('download success');
            });
        **/
        downloadImage: function(url, success, fail, process, mode){
            var args = [url,
                        halo.createCallback(success), 
                        halo.createCallback(fail),
                        halo.createCallback(proccess),
                        mode];
            return halo.exec(Multimedia, 'downloadImage', args);
        },
        /**
        下载铃声
        @method downloadRington
        @param {String} url 铃声地址
        @param {Function} sucess 下载成功的回调
        @param {Function} fail 下载失败的回调
        @param {Function} process 下载过程中的进度回调
        @param {String} mode 是否显示下载模态窗口
        @example
            
            var url = 'http://example.com/example.mp3';
            navigator.app.downloadRington(url, function(){
                console.log('download success');
            });
        **/
        downloadRington: function(url, success, fail, process, mode){
            var args = [url,
                        halo.createCallback(success), 
                        halo.createCallback(fail),
                        halo.createCallback(proccess),
                        mode];
            return halo.exec(Multimedia, 'downloadRington', args);
        },
        /**
        设置壁纸
        @method setAsWallpaper
        @param {String} url 壁纸地址
        @param {Function} sucess 设置成功的回调
        @param {Function} fail 设置失败的回调
        @param {Function} process 下载过程中的进度回调
        @param {String} mode 是否显示下载模态窗口
        @example
            
            var url = 'http://bbs.aliyun.com/images/wind85/logo.png';
            navigator.app.setAsWallpaper(url, function(){
                console.log('download success');
            });
        **/
        setAsWallpaper: function(url, success, fail, process, mode){
            var args = [url,
                        halo.createCallback(success), 
                        halo.createCallback(fail),
                        halo.createCallback(proccess),
                        mode];
            return halo.exec(Multimedia, 'setAsWallpaper', args);
        },
        /**
        设置铃声
        @method setAsRington
        @param {String} url 铃声地址
        @param {Function} sucess 设置成功的回调
        @param {Function} fail 设置失败的回调
        @param {Function} process 下载过程中的进度回调
        @param {String} mode 是否显示下载模态窗口
        @example
            
            var url = 'http://example.com/example.mp3';
            navigator.app.setAsRington(url, function(){
                console.log('download success');
            });
        **/
        setAsRington: function(url, success, fail, process, mode){
            var args = [url,
                        halo.createCallback(success), 
                        halo.createCallback(fail),
                        halo.createCallback(proccess),
                        mode];
            return halo.exec(Multimedia, 'setAsRington', args);
        },
        /**
        播放视频
        @method playVideo
        @param {String} url 视频地址，只支持远程地址
        @param {Function} sucess 播放成功的回调
        @param {Function} fail 播放失败的回调
        @example
            var url = "http://www.video-host.com/video-name.mp4";
            navigator.app.playVideo(url);
        **/
        playVideo: function(url, success, fail){
            var args = [url,
                        halo.createCallback(success), 
                        halo.createCallback(fail)];
            return halo.exec(Multimedia, 'playVideo', args);
        },
        /**
        转换成可以缓存的URL
        @method toCacheUrl
        @param {String} url 需要被转化成可缓存URL的原URL地址
        @return {String} 转化成可缓存URL后的URL地址
        @example
            var url = 'http://m.alicdn.com/xxxx/yyyy.png';
            var urlCached = navigator.app.toCacheUrl(url);
            console.log(urlCached);  // output: /__resourcehttp://m.alicdn.com/xxxx/yyyy.png
        **/
        toCacheUrl: function(url){
            if(/^https?:\/\//.test(url) && halo._internalCode > 1){
                return '/__resource' + url;
            }
            return url;
        },
        /**
        获取桌面7屏上的云应用信息
        @method getScreenApplications
        @return {Object} 桌面7屏的云应用信息
        @example
            var apps = navigator.app.getScreenApplications();
            apps.forEach(function(item){
                //屏幕id -3,-2,-1,0,1,2,3
                console.log(item.screenId);
                //appid
                console.log(item.id);
                //是否锁定不可替换
                console.log(item.locked);
                //图标的路径
                console.log(item.iconPath);
            });
        **/
        getScreenApplications: function(){
            var results = halo.exec(APP_MANAGER, 'getScreenApplications');
            return JSON.parse(results);
        },
        /**
        操作应用，添加、删除、替换到首屏，添加到桌面
        @method operateApplication
        @protected
        @param {Object} options 云应用信息
        @param {String} options.type 应用的类型，可选：`CLOUDAPP`, `NATIVEAPP`
        @param {String} action 操作类型，可选：`CREATE_SHORTCUT`, `ADD_TO_SCREEN`, `REMOVE_FROM_SCREEN`, `REPLACE_SCREEN`, `START_ON_SCREEN`
        @param {Function} success 操作成功的回调函数
        @param {Function} fail 操作失败的回调函数
        @example
            var options = {
                type: 'CLOUDAPP',
                target: -1,
                id :  'cloudappstore.mobile.aliyun.com/queqiao/manifest/id/44'
            }
            var action = 'ADD_TO_SCREEN';
            navigator.app.operateApplication(options, action, function(){
                console.log('操作成功');
            });
        **/
        operateApplication: function(options, action, success, fail){
            var args = [JSON.stringify(options),
                        action,
                        halo.createCallback(success),
                        halo.createCallback(fail)];
            return halo.exec(APP_MANAGER, 'operateApplication', args);
        },
        /**
        获得云应用的状态
        @method getCloudApplicationInfo
        @param {Object} options 云应用的信息
        @param {Function} success 操作成功的回调函数
        @param {Function} fail 操作失败的回调函数
        @example
            
            var option = {
                id: 'cloudappstore.mobile.aliyun.com/queqiao/manifest/id/44'
            }
            navigator.app.getCloudApplicationInfo(option, function(info){
                console.log(info.IsShortcutCreated);
                console.log(info.IsOnScreen);
            });
        **/
        getCloudApplicationInfo: function(options, success, fail){
            var info = {
                    'type': 'CLOUDAPP',
                    'id': this._fixuuid(options['id'])
                },
                args = [JSON.stringify(info),
                        halo.createCallback(function(info){
                            success && success(JSON.parse(info));
                        }),
                        halo.createCallback(fail)];

            return halo.exec(APP_MANAGER, 'getApplicationInfo', args);
        },
        /**
        获得原生应用的状态
        @method getNativeApplicaionInfo
        @param {Object} options 原生应用的信息
        @param {Function} success 操作成功的回调函数
        @param {Function} fail 操作失败的回调函数
        @example
            
            var option = {
                'package': 'com.aliyun.wireless.vos.appstore'
            }
            navigator.app.getCloudApplicationInfo(option, function(info){
                console.log(info.status);
            });
        **/
        getNativeApplicaionInfo: function(options, success, fail){
            var info = {
                    'type': 'CLOUDAPP',
                    'package': options['package']
                },
                args;
            if(options.version){
                info.version = options.version;
            }
            if(options.name){
                info.name = options.name;
            }
            args = [JSON.stringify(info),
                    halo.createCallback(function(info){
                        success && success(JSON.parse(info));
                    }),
                    halo.createCallback(fail)];
            return halo.exec(APP_MANAGER, 'getApplicationInfo', args);

        },
        /**
        启动云应用
        @method startCloudApplication
        @param {Object} options 云应用的信息
        @param {Function} success 操作成功的回调函数
        @param {Function} fail 操作失败的回调函数
        @example
            
            var options = {
                'id': 'cloudappstore.mobile.aliyun.com/queqiao/manifest/id/44',
                'data': 'app arguments'
            }
            navigator.app.startCloudApplication(options);
        **/
        startCloudApplication: function(options, success, fail){
            var info = {
                    'type': 'CLOUDAPP',
                    'id': this._fixuuid(options['id']),
                    'data': options['data']
                },
                args = [JSON.stringify(info),
                        halo.createCallback(fail),
                        halo.createCallback(success)];
            if (halo._internalCode > 2) {
				return this.operateApplication(info, "START_ON_SCREEN", success, fail);
			} else {
               return halo.exec(Device, 'launchApplication', [info.id, info.data]);
			}
        },
        /**
        启动原生应用
        @method startNativeApplication
        @param {Object} options 原生应用的信息
        @param {Function} success 操作成功的回调函数
        @param {Function} fail 操作失败的回调函数
        @example
            
            var options = {
                "package": "com.aliyun.wireless.vos.appstore",
                data : "8762"
            }
            navigator.app.startNativeApplication(options);
        **/
        startNativeApplication: function(options, success, fail){
            var info = {
                    'type': 'NATIVEAPP',
                    'package': options['package'],
                    'data': options['data']
                },
                args = [JSON.stringify(info),
                        halo.createCallback(fail),
                        halo.createCallback(function(data){
                            if(!success){
                                return;
                            }
                            var json;
                            try{
                                json = JSON.parse(data);
                            }catch(err){
                                json = data;
                            }
                            success(json);
                        })];
            return halo.exec(APP_LAUNCHER, 'launchApplication', args);
        },
        /**
        退出当前云应用
        @method exit
        @example
            
            document.addEventListener("resetbutton", function(e){
                navigator.app.exit(); 
            }, false);
        **/
        exit: function(){
            return halo.exec(APP_MANAGER, 'exitApplication');
        }
    }

    /**
    云应用启动时的参数
    @property arguments
    @type {String}
    @readOnly
    @example
        
        console.log("该应用的启动变量是：" + navigator.app.arguments);
    **/
    module.exports.__defineGetter__('arguments', function(){
        if(args !== undefined){
            return args;
        }
        try{
            args = halo.exec(APP_MANAGER, 'getArguments');
        }catch(err){
            args = null;
        };
        return args;
    });

});
define('halo/plugin/calendar', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    
    /**
    calendar提供在日历中添加，删除事件的功能。
    @class calendar
    @static
    @namespace navigator
    **/
    module.exports = {
        
        /**
        添加日历事件
        @method addEvent
        @param {Object} event 日历事件
        **/
        addEvent: function(event){
            return halo.exec('Calendar', 'addEvent', JSON.stringify(event));
        },
        /**
        删除日历事件
        @method removeEvent
        @param {Object} event 日历事件
        **/
        removeEvent: function(event){
            return halo.exec('Calendar', 'delEvent', JSON.stringify(event));
        },
        /**
        更新日历事件
        @method updateEvent
        @param {Object} event 日历事件
        **/
        updateEvent: function(event){
            return halo.exec('Calendar', 'updateEvent', JSON.stringify(event));
        }
    }

});
define('halo/plugin/camera', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    
    /**
    从摄像头或者从图库中选取图片
    @class camera
    @static
    @namespace navigator
    **/
    module.exports = {
        
        /**
        从摄像头捕获图片或者从图库中选取图片
        @method getPicture
        @param {Function} success 选取图片成功的回调函数
        @param {Function} fail 选取图片失败的回调函数
        @param {Object} options 选取参数
            @param {String} options.sourceType 图片的来源，默认是`camera`，表示从摄像头选择图片
            @param {String} options.destinationType 图片的格式，默认是`file`，表示文件路径
        @example

            navigator.camera.getPicture(function(localUrl){
                console.log("The local URL is " + localUrl);
            });
            
            var options = {

                //从图库中选取图片
                sourceType: 'library',

                //返回系统绝对路径，用于使用Cloud API进行文件上传
                destinationType: 'path'
            }
            navigator.camera.getPicture(function(localUrl){
            }, null, options);
        **/
        getPicture: function(success, fail, options){
            var defaults = {
                    //quality: 70, //havent't supported
                    sourceType: 'camera',
                    destinationType: 'file'
                },
                type,
                args;

            options = options || {};
            
            if(!options.sourceType){
                options.sourceType = defaults.sourceType;
            }
            if(!options.destinationType){
                options.destinationType = defaults.destinationType;
            }
            
            if(options.destinationType === 'path'){
                type = "path";
            }else{
                type = "url";
            };
            args = [type, halo.createCallback(success), halo.createCallback(fail)];
            if(options.sourceType === 'camera'){
                return halo.exec('Multimedia', 'takePhoto', args);
            }else{
                return halo.exec('Multimedia', 'pickImage', args);
            }
        }
    }

});
define('halo/plugin/compass', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    
    /**
    捕获设备的东西南北方位
    @class compass
    @static
    @namespace navigator
    **/
    module.exports = {

        /**
        获取设备当前的方位
        @method getCurrentHeading
        @param {Function} success 获取方位成功后的回调函数
        @param {Function} fail 获取方位失败后的回调函数
        @return {Number} 当前方位
        @example

            function onSuccess(heading) {
                console.log('Heading: ' + heading);
            };
            navigator.compass.getCurrentHeading(onSuccess);
        **/
        getCurrentHeading: function(success, fail){
            var heading =  halo.exec('Device', 'getCurrentHeading');
            if(heading != -1){
                if(success){
                    success(heading);
                }
            }else if(fail){
                fail();
            }
            return heading;
        },
        
        /**
        实时监听设备的方位
        @method watchHeading
        @param {Function} success 获取方位成功后的回调函数
        @param {Function} fail 获取方位失败后的回调函数
        @param {Object} options 监听的参数
            @param {Number} options.frequency 触发的时间频率，单位是毫秒，默认值3000
        @return {Number} 监听计时器的ID
        @example

            function onChange(heading) {
                myCompass.setRotation(heading);
            };
            var watchId = navigator.compass.watchHeading(onChange);
        **/
        watchHeading: function(success, fail, options){
            var self = this,
                defaults = { frequency: 3000 };
            options = options || {};
            if(!options.frequency || options.frequency <= 0){
                options.frequency = defaults.frequency;
            }

            var watchId = setInterval(function(){
                self.getCurrentHeading(success, fail);
            }, options.frequency);
            return watchId;
        },
        
        /**
        停止设备方位的实时监听
        @method clearWatch
        @param {Number} watchId 监听计时器ID
        @example
            
            document.addEventListener("pause", function(){
                navigator.compass.clearWatch(watchId);
            });
        **/
        clearWatch: function(watchId){
            clearInterval(watchId);
        }
    }

});
define('halo/plugin/connection', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo'),
        validateFlag,
        CELL_2G_GROUP = ['NETWORK_TYPE_GPRS', 'NETWORK_TYPE_EDGE', 'NETWORK_TYPE_CDMA', 'NET_TYPE_2G'],
        CELL_3G_GROUP = ['NETWORK_TYPE_EVDO_0', 'NETWORK_TYPE_EVDO_A', 'NETWORK_TYPE_UMTS', 'NETWORK_TYPE_HSDPA', 
             'NETWORK_TYPE_HSPA', 'NETWORK_TYPE_HSUPA', 'NET_TYPE_3G_HSPA', 'NET_TYPE_3G'];

    /**
    用于获取网络相关信息和设置网络

        var connection = navigator.network.connection;

        //判断网络是否可以
        console.log(connection.onLine);

        //判断是否是移动网络
        console.log(connection.mobile);

        //判断是否是WIFI网络
        console.log(connection.wifi);
        
        //去设置网络
        connection.setting(function(onLine){
            //设置网络完毕，onLine表示网络是否可以
        });

    @class connection
    @static
    @namespace navigator.network
        
        
    **/
    var NetworkConnection = function(){
        /**
        UNKNOWN表示当前网络的详细类型是未知的
        @const UNKNOWN
        @type String
        **/
        this.UNKNOWN = 'unknown';
        /**
        NONE表示当前网络未连接上
        @const NONE
        @type String
        **/
        this.NONE = 'none';
        /**
        WIFI表示当前网络是wifi
        @const WIFI
        @type String
        **/
        this.WIFI = 'wifi';
        /**
        CELL_2G表示当前网络是2G网络
        @const CELL_2G
        @type String
        **/
        this.CELL_2G = '2g';
        /**
        CELL_3G表示当前网络是3G网络
        @const CELL_3G
        @type String
        **/
        this.CELL_3G = '3g'
    };
    
    document.addEventListener('resume', function(){
        if(validateFlag){
            validateFlag[0].call(validateFlag[1], module.exports.onLine);
        }
        validateFlag = null;
    }, false);
    
    /**
    获取网络信息
    @method getInfo
    @example
        
        navigator.network.connection.getInfo(function(info){
            console.log("网络的详细类型是: " + info.type);
        });
    **/
    NetworkConnection.prototype.getInfo = function(success, fail){
        var args = [halo.createCallback(function(type){
                success && success({type: type});
            }), halo.createCallback(fail)];

        return halo.exec('Device', 'getNetworkType', args);
    };
    
    /**
    设置网络
    @method setting
    @param {Function} callback 设置完回到应用后的回调函数
    @param {Object} proxy 回调函数的作用域
    @example
        
        //设置网络
        navigator.network.connection.setting();

        //设置网络，监听回调
        navigator.network.connection.setting(function(onLine){
            console.log("network available: " + onLine);
        });
        
        function ServiceDelegate(){
        }
        ServiceDelegate.prototype.getProductList = function(callback){
            var connection = navigator.network.connection;
            if(connection.onLine){
                //send xhr request
            }else{
                //设置回调函数的作用域
                connection.setting(function(onLine){
                    this.getProductList();
                }, this);
            }
        }
    **/
    NetworkConnection.prototype.setting = function(callback, proxy){
        validateFlag = [callback, proxy];
        return halo.exec('DeviceStateInfo', 'wirelessSetting');
    };
    
    /**
    是否为mobile网络
    @property mobile
    @readOnly
    @type {Boolean}
    @example

        if(navigator.network.connection.mobile){
            console.log("当前网络是移动网络");
        }
    **/
    NetworkConnection.prototype.__defineGetter__('mobile', function(){
        return halo.exec('DeviceStateInfo', 'getNetworkInfo') === 'mobile';
    });

    /**
    是否为wifi网络
    @property wifi
    @readOnly
    @type {Boolean}
    @example
        if(navigator.network.connection.wifi){
            console.log("当前网络是WIFI网络");
        }
        
    **/
    NetworkConnection.prototype.__defineGetter__('wifi', function(){
        return halo.exec('DeviceStateInfo', 'getNetworkInfo') === 'wifi';
    });
    
    /**
    检查网络类型，判断是否是2G、3G网络的快捷入口。
    @method getType
    @param callback {Function} 获得网络类型后的回调函数
    @example
        
        navigator.network.connection.getType(function(type){
            console.log("当前的网络类型是：" + type);
        });
    **/
    NetworkConnection.prototype.getType = function(callback){
        if(!callback){
            return;
        }
        var NONE = this.NONE,
            WIFI = this.WIFI,
            UNKNOWN = this.UNKNOWN,
            CELL_2G = this.CELL_2G,
            CELL_3G = this.CELL_3G;

        if(!this.onLine){
           return callback(NONE);
        }
        if(this.wifi){
           return callback(WIFI);
        }
        try{
            this.getInfo(function(data){
               var type = data.type;
               if(CELL_2G_GROUP.indexOf(type) != -1){
                    callback(CELL_2G);
                }else if(CELL_3G_GROUP.indexOf(type) != -1){
                    callback(CELL_3G);
                }else{
                    callback(UNKNOWN);
                }
           }, function(){
                callback(UNKNOWN); 
           });
        }catch(err){
            callback(UNKNOWN);
        }
    };
    
    /**
    网络是否可用
    @property onLine
    @readOnly
    @type {Boolean}
    @example
        
        if(navigator.network.connection.onLine){
            console.log("当前网络可用");
        }
    **/
    NetworkConnection.prototype.__defineGetter__('onLine', function(){
        return halo.exec('DeviceStateInfo', 'isNetworkAvailable') === "true";
    });
    
    module.exports = new NetworkConnection();

});
define('halo/plugin/contacts', function (require, exports, module) {

    /**
    @module halo
    **/
    var cloudapi = require('halo');

    /**
    获取联系人相关信息
    @class contacts
    @static
    @namespace navigator
    **/
    module.exports = {
        
        //这他妈的什么烂接口，如果想同时获得email和phone就不行了。。。
        /**
        从联系人列表中选择一个联系人，并获得联系人的email或phone等联系信息。
        @method pick
        @param {Function} success 获取联系信息成功的回调
        @param {Function} fail 获取联系信息失败的回调
        @param {Object} options 获得联系信息时设置的过滤参数
            @param {String} options.type 信息类型，默认是`email`，表示获取email信息
        
        @example
            navigator.contacts.pick(function(result){
                console.log("你选择的联系人的姓名是: " + result.name);
                console.log("你选择的联系人的email是: " +  result.data[0]);
            });
            
            
            var options = {type: 'phone'};
            navigator.contacts.pick(function(result){
                console.log("你选择的联系人的姓名是: " + result.name);
                console.log("你选择的联系人的电话是: " + result.data[0]);
            }, null, options);
        **/
        pick: function (success, fail, options) {
            var actionCount = 0,
                defaults = {
                    type: 'email'
                },
                method,
                haloSuccess,
                haloFailed;

            options = options || {};

            if (!options.type) {
                options.type = defaults.type;
            }

            if (options.type === 'email') {
                method = 'peekEmail';
            }else{
                method = 'peekPhoneNumber';
            }
            
            haloSuccess = halo.createCallback(function (data) {
                var arr = data.split(','),
                    name = arr[0] || '',
                    data = arr.slice(1) || [];
                success && success({name: name, data: data});
            });
            haloFailed = halo.createCallback(function (e) {
                fail && fail(e);
            });
            return halo.exec('Contacts', method, [haloSuccess, haloFailed]);
        }
    }

});
define('halo/plugin/device', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');

    var uuid,
        deviceId,
        physicalSize,
        readyList = [];
    /**
    设备相关的全局对象，使用该对象可以获取手机的一些基本信息。比如手机的型号, uuid, deviceId, 语言设置, 云OS版本, 物理分辨率等。
        
        //输出设备型号
        console.log(device.name);
        
        //输出OS版本号
        console.log(device.version);

        //输出当前语言设置
        console.log(device.language);

        //输出deviceId (MD5之后的IMEI号);
        console.log(device.deviceId);

        //输出uuid
        console.log(device.uuid);
        
        //输出屏幕的分辨率
        console.log(device.physicalSize);

    @class device
    @static
    **/
    function Device(){
        
        /**
        表面device是否可用
        @property _ready
        @private
        @type Boolean
        **/
        this._ready = !!document.body;

        this.ready(function(){

            /**
            设备的型号
            @property name
            @readOnly
            @type {String}
            @example
                
                console.log("你的手机型号是: " + device.name);
            **/
            this.name = halo.getSystemInfo().platform.Model;

            /**
            操作系统平台
            @property platform
            @readOnly
            @default YunOS
            @type {String}
            @example
                
                console.log("当前的运行平台是: " + device.platform);  //output: 当前的运行平台是: YunOS
            **/
            this.platform = 'YunOS';

            /**
            操作系统当前的语言设置
            @property language
            @readOnly
            @type {String}
            @example
                
                console.log("当前的语言设置是: " + device.language);
            **/
            this.language = halo.getSystemInfo().platform.Locale;

            /**
            操作系统的版本号
            @property version
            @readOnly
            @type {String}
            @example
                
                console.log("当前的云OS系统版本是: " + device.version);
            **/
            this.version = halo.getSystemInfo().platform.SystemFrameworkVersion;

        }, this);

    };
    
   /**
    设备的deviceId, MD5之后的IMEI号
    @property deviceId
    @readOnly
    @type {String}
    @example
            
        console.log("手机的deviceId是: " + device.deviceId);
    **/
    Device.prototype.__defineGetter__('deviceId', function(){
        if(deviceId !== undefined){
            return deviceId;
        }
        var args = [halo.createCallback(), halo.createCallback()];
        try{
            deviceId = halo.exec('Device', 'getDeviceId', args);
        }catch(err){
            deviceId = null;
        };

        return deviceId;
    });
    
    /**
    设备的uuid
    @property uuid
    @readOnly
    @type {String}
    @example
            
        console.log("手机的uuid是: " + device.uuid);
    **/
    Device.prototype.__defineGetter__('uuid', function(){
        if(uuid !== undefined){
            return uuid;
        }
        var count = 0;
        while(!uuid && count < 20){
            try{
                uuid = halo.exec('PIM', 'getCloudUUID');
            }catch(err){
                uuid = null;
                count = 20;
            }
        }
        if(uuid == 'false'){
            uuid = null;
        }
        return uuid;
    });
    /**
    设备的物理分辨率
    @property physicalSize
    @readOnly
    @type {Object}
    @example
        
        var physicalSize = device.physicalSize;
        console.log("手机的物理分辨率是: width = %s heigth = %s", physicalSize.width, physicalSize.height);
    **/
    Device.prototype.__defineGetter__('physicalSize', function(){
        if(physicalSize){
            return physicalSize;
        }
        if(halo._internalCode > 2){
            var size;
            try{
                halo.getSystemInfo().get('OutputDevices', function (data) {
                   size = data.displayDevices[0];
                });
            }catch(err){
                halo.log(err)
            };
            if(size){
                physicalSize = {
                    width: size.physicalWidth,
                    height: size.physicalHeight
                }
                return physicalSize;
            }
        }
        var dict = {
            'WVGA': {
                model: ['W700','W800','W680','W688','W806','W718','W710'],
                size: [800, 480]
            },
            'HVGA' :{
                model: ['W650', 'W619', 'E650', 'E619', 'W621', 'W658'],
                size: [480, 320]
            }
        }
        var model = this.name;
        for(var i in dict){
            if(dict[i].model.indexOf(model) !== -1){
                physicalSize = {
                    width: dict[i].size[0],
                    height: dict[i].size[1]
                }
                return physicalSize;
            }
        }
        physicalSize = {
            width: 480,
            height: 800
        }
        return physicalSize;
    });
    
    /**
    获取device信息，包含了很多设备相关的属性
    @method getInfo
    @return {Object} device信息
    @example

        var info = device.getInfo();
        console.log(info.Model === device.name);  //output: true
        console.log(info.SystemFrameworkVersion === device.version);  //output: true
    **/
    Device.prototype.getInfo = function() {
        return halo.getSystemInfo().platform;
    }
    

    /**
    在ready回调中获取device的属性是比较安全的做法。如果halo的脚本放在body里面，是不需要在回调中获取device属性的。
    但是halo脚本在HTML文档的head中就引入了，那安全的做法是在ready回调中再获取device的属性。
    @method ready
    @param {Function} callback 回调函数
    @param {Object} proxy 回调函数的作用域
    @example
        
        device.ready(function(){
            console.log(device.name);
        });
    **/
    Device.prototype.ready = function(callback, proxy){
        if(this._ready){
            callback.apply(proxy);
        }else{
           readyList.push([callback, proxy]);
        }
    };
    
    module.exports = new Device();

    //device的一些属性依赖于object插件的初始化，需要在DOM ready后才能获取这些属性
    if(!exports._ready){
        var DOMContentLoaded = function(){
            document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
            exports._ready = true;
            readyList.forEach(function(item){
                item[0].apply(item[1]);
            });
            readyList = null;
        }
        document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
    }

});
define('halo/plugin/geolocation', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    

    /**
    捕获设备的地理定位
        
        navigator.geolocation.getCurrentPosition(function(data){
             console.log('latitude: %s longitude: %s', data.coords.latitude, 
                data.coords.longitude);
        });

    @class geolocation
    @static
    @namespace navigator
    **/
    module.exports = {
        /**
        获取地理定位
        @method getCurrentPosition
        @param {Function} success 定位成功后的回调函数
        @param {Function} fail 定位失败后的回调函数
        @example

            function onSuccess(data) {
                console.log('latitude: %s longitude: %s', data.coords.latitude, 
                    data.coords.longitude);
            };
            navigator.geolocation.getCurrentPosition(onSuccess);
        **/
        getCurrentPosition: function(success, fail){
            var args = [halo.createCallback(success), halo.createCallback(fail)];
            return halo.exec('DeviceStateInfo', 'getCurrentPosition', args);
        },
        /**
        实时监听设备的地理定位
        @method watchPosition
        @param {Function} success 定位成功后的回调函数
        @param {Function} fail 定位失败后的回调函数
        @return {Number} 监听计时器的ID
        @example

            function onChange(data) {
                console.log('latitude: %s longitude: %s', data.coords.latitude, 
                    data.coords.longitude);
            };
            var watchId = navigator.geolocation.watchPosition(onChange);
        **/
        watchPosition: function(success, fail, options){
            var self = this,
                watching = false,
                watchId,
                defaults = {
                    maximumAge: 3000,
                    timeout: 5000
                };

            wathcId = setInterval(function(){
                if(watching){
                    return;
                }
                self.getCurrentPosition(function(){
                    watching = false;
                    if(success){
                        success.apply(null, arguments);
                    }
                }, function(){
                    watching = false;
                    if(fail){
                        fail.apply(null, arguments);
                    }
                });
                watching = true;
            }, defaults.maximumAge);

            return watchId;
        },
        /**
        停止设备地理定位的实时监听
        @method clearWatch
        @param {Number} watchId 监听计时器ID
        @example
            
            document.addEventListener("pause", function(){
                navigator.geolocation.clearWatch(watchId);
            });
        **/
        clearWatch: function(watchId){
            clearInterval(watchId);
        }
    }

});
define('halo/plugin/notification', function(require, exports, module) {
    
    /**
    @module halo
    **/
    var halo = require('halo');
    
    /**
    用于弹出toast提示信息。
        
        navigator.notification.toast("系统提示");

    @class notification
    @static
    @namespace navigator
    **/
    module.exports = {

        /**
        使用toast提示信息
        @method toast
        @param {String} msg 提示信息
        @example
            
            navigator.notification.toast('I see U') //toast: I see U
        **/
        toast: function(msg){
            return halo.exec('Utility', 'toast', [msg]);
        }
    }

});
define("halo/plugin/pay", function(require, exports, module) {

    /**
    @module halo
    **/
    var halo = require("halo");
    
    /**
    pay是支付模块，交易型的应用需要使用到该模块。系统提供了三种支付方式。
    @class pay
    @static
    @namespace navigator
    **/
    module.exports = {

        /**
        淘宝订单支付，该支付接口只适用于淘宝订单
        @method taobaopay
        @param {String} order 生成淘宝订单以后返回的`支付宝订单号`,多个订单号可以用分号隔开。
        @param {String} token 淘宝登陆的token
        @param {Function} success 成功调起支付组件后执行，只要支付组件被唤起，则执行该回调函数。
        @param {Function} fail 支付组件调起失败。
        @example
            var onSuccess = function(){
                console.log("支付组件启动成功");
            }
            $.getJSON('/createorder/', function(data){
                navigator.pay.taobaopay(data.order, data.token, onSuccess);
            });

        **/
        taobaopay: function(order, token, success, fail){
            var args = [order, token, cloudapi.createCallback(success), cloudapi.createCallback(fail)];
            return halo.exec("Alipay", "pay", args);
        },
        /**
        统一支付，该接口用于支付第三方(除淘宝以外)的订单支付。
        @method alipay
        @param {String} order 支付宝订单号,主要包含外部商户的订单信息。以key="value"形式,呈现。示例如下:

            partner="2088002007260245"&seller="20880020072
            60245"&out_trade_no="500000000006548"&subject=
            " 商 品 名 称 "&body=" 这 是 商 品 描 述
            "&total_fee="30"&notify_url="http://notify.jav
            a.jpxx.org/index.jsp"&sign="kU2Fa3x6V985g8ayTo
            zI1eJ5fHtm8%2FJGeJQf9in%2BcVmRJjHaExbirnGGKJ%2
            F7B63drqc4Kjlk%2FSg6vtSIkOtdvVBrRDpYaKxXVqkJTz
            RYgUwrrpMudbIj9aMS2O3dHG0GPyL4Zb6jKDYXHabGG0aB
            JY3QA7JuTJ23t6SqV%2B5f1xg%3D"&sign_type="RSA"

        @param {Function} success 调用接口成功时回调的，调用接口成功不代表支付成功，需要根据接口返回值判定支付是否成功。

            9000表示：操作成功
            4000表示：系统异常
            4001表式：数据格式不正确
            4003：该用户绑定的支付宝账户被冻结或不允许支付
            4004：该用户已解除绑定。
            4005：绑定失败或没有绑定
            4006：订单支付失败
            4010：重新绑定账户
            6000：支付服务正在进行升级操作

        @param {Function} fail 调用接口失败时回调的。
        @example
            var onSuccess = function(code){
                if(code == 9000){
                    console.log("下单成功");
                }
            }
            $.get("/getOrder/", {
                //生成订单的参数
            },function(order){
                navigator.pay.alipay(order, onSuccess, onFail);
            });
        **/
        alipay: function(order, success, fail){
            var args = [order, cloudapi.createCallback(success), cloudapi.createCallback(fail)];
            return halo.exec("Payment", "Alipay", args); 
        },
        /**
        红包支付，调用红包支付组件。
        该接口在pay.alipay方法之上，封装了一层，使得支付过程中可以使用红包来结算订单，同时也可以知道支付结果
        @method hongbaopay
        @param {String|Object} order 订单的详情
            @param {Object} order.data 订单的数据
                @param {String} order.data.yun_id 商户ID，云账户名，（该云账户需要在支付平台注册成为商户并开通支付服务），代表支付原始订单生产方
                @param {String} order.data.cp_yun_id 应用提供商的云账户名，该云账户需要在支付平台注册成为商户，代表分润方。
                    该笔订单成功交易的金额将即时划到该商户对应的支付宝账号中cp_yun_id可以和yun_id可以相同。
                @param {String} order.data.app_id 云应用的id。指示该订单来源于上述开发者的哪个应用,必须在支付平台登记配置其分润模式。
                @param {String} order.data.content_name 合作伙伴方提供的商品或服务名称
                @param {String} order.data.content_price 合作伙伴方提供的商品价格
                @param {String} order.data.hongbao_amount 商品可用红包金额
                @param {String} order.data.partner_notify_url 通知合作伙伴订单状态的URL
                @param {String} order.data.partner_order_no 合作伙伴生成的订单号(64位以内)
            @param {String} order.sign 代表用户身份的sign，服务器端生成
        @param {Function} success 调用接口成功时回调的，调用接口成功不代表支付成功，需要根据接口返回值判定支付是否成功。

            9000表示：操作成功
            4000表示：系统异常
            4001表式：数据格式不正确
            4003：该用户绑定的支付宝账户被冻结或不允许支付
            4004：该用户已解除绑定。
            4005：绑定失败或没有绑定
            4006：订单支付失败
            4010：重新绑定账户
            6000：支付服务正在进行升级操作

        @param {Function} fail 调用接口失败时回调的。
        @example
            var onSuccess = function(code){
                if(code == 9000){
                    console.log("下单成功");
                }
            }
            $.get("/getOrder/", {
                //生成订单的参数
            },function(order){
                navigator.pay.hongbaopay(order, onSuccess, onFail);
            });
        **/
        hongbaopay: function(order, success, fail){
            if(typeof order === 'object'){
                var toQueryString = function(obj){
                    var arr = [];
                    for(var i in obj){
                        if(obj.hasOwnProperty(i)){
                            arr.push(i + '=' + encodeURIComponent(obj[i]));
                        }
                    }
                    return arr.join('&');
                }
                order = 'data=' + toQueryString(order.data) + '&sign=' + encodeURIComponent(sign);
            }
            var args = [order, cloudapi.createCallback(success), cloudapi.createCallback(fail)];
            return halo.exec("AliyunPay", "pay", args); 
        }
    }

});
define('halo/plugin/pim', function(require, exports, module) {

    /**
    @module halo
    **/
    var halo = require('halo');
    
    var PIM = 'PIM';
    /**
    pim是个人信息管理模块，使用该模块可以取得用户的登录信息。在云OS上，用户可以通过云账号绑定淘宝账号，支付宝账号。通过相应的API，
    可以在应用中达到账号互通的效果。
    @class pim
    @static
    @namespace navigator
    **/
    module.exports = {

        /**
        获取云账号信息，云账号信息包含NICKNAME和KP，NICKNAME是用户昵称，KP是组成OAuth token的一部分。
        @method getUserInfo
        @param {Function} success 正确时的回调函数
        @param {Function} fail 失败时的回调函数
        @param {Boolean} askToLogin 登出时是否弹出登录面板
        @example
            navigator.pim.getUserInfo(function(data){
                console.log("username: %s KP: %s", data.NICKNAME, data.KP);
            });
        **/
        getUserInfo: function(success, fail, askToLogin){
           var flag = askToLogin ? 'true': 'false',
            args = [flag, halo.createCallback(function(data){
                if(success){
                    success(JSON.parse(data));
                }
            }), halo.createCallback(fail)];
            return halo.exec(PIM, 'getUserInfo', args);
        },
        /**
        绑定淘宝账号，如果调用该方法，则会弹出淘宝登陆界面。
        @method bindTaobao
        @param {Function} success 正确时的回调函数
        @param {Function} fail 失败时的回调函数
        @example
            navigator.pim.bindTaobao(function(){
                console.log("淘宝账号绑定成功");
            });
        **/
        bindTaobao: function(success, fail){
            var args = [halo.createCallback(function(data){
                    if(data === 'true'){
                        if(success){
                            success();
                        }
                    }else{
                        if(fail){
                            fail();
                        }
                    }
                }), halo.createCallback(fail)];
            return halo.exec(PIM, 'bindTaobao', args);
        },
        /**
        获得手机上缓存的sign，手机上的sign是代表OAuth token，用于在服务器端作用户验证。
        注意，缓存的sign可能是过期的sign，服务器端需要对sign做验证，如果过期，则返回特定的code给手机客户端，
        若手机客户端得知服务器端的返回的sign过期信息，可通过`getSign`方法重新从服务器上获取最新的sign。
        @method peekSign
        @param {Function} success 正确时的回调函数
        @param {Function} fail 失败时的回调函数
        @example
            navigator.pim.peekSign(function(sign){
                console.log("手机上缓存的sign是：%s", sign);
            });
        **/
        peekSign: function(success, fail){
            return halo.exec(PIM, 'peekSign');
        },
        /**
        从网络获取sign，手机上的sign是代表OAuth token，用于在服务器端作用户验证。
        @method getSign
        @param {Function} success 正确时的回调函数
        @param {Function} fail 失败时的回调函数
        @param {Boolean} askToLogin 登出时是否弹出登录面板
        @example
            navigator.pim.getSign(function(sign){
               console.log("服务器取回的sign是：%s", sign);
            });
        **/
        getSign: function(success, fail, askToLogin){
            var flag = askToLogin ? 'true': 'false',
                args = [flag, halo.createCallback(success), halo.createCallback(fail)];
            return halo.exec(PIM, 'getSign', args);
        },
        /**
        获取名片信息，名片信息包含用户的名称，手机，街道和组织信息。
        @method getBusinessCard
        @return {Object}
        @example
            var mycard = navigator.pim.getBusinessCard();
            console.log("name: %s", mycard.displayName);
            console.log("phone: %s", mycard.phoneNumbers[0].value);
            console.log("street: %s", mycard.addresses[0].streetAddress);
            console.log("organizations: %s@%s", mycard.organizations[0].title, 
                mycard.organizations[0].name);
        **/
        getBusinessCard: function(){
            return JSON.parse(halo.exec(PIM, 'getBusinessCard'));
        }
    }

});
require('halo').inject({
    halo: {
       path: 'halo'
    },
    device: {
        path: 'halo/plugin/device'
    },
    navigator: {
        children: {
            app: {
                path: 'halo/plugin/app'
            },
            pim: {
                path: 'halo/plugin/pim'
            },
            camera: {
                path: 'halo/plugin/camera'
            },
            calendar: {
                path: 'halo/plugin/calendar',
            },
            compass: {
                path: 'halo/plugin/compass'
            },
            network:{
                children: {
                    connection: {
                        path: 'halo/plugin/connection'
                    }
                }
            },
            geolocation: {
                pattern: 'overwrite',
                path: 'halo/plugin/geolocation'
            },
            notification: {
                path: 'halo/plugin/notification'
            },
            contacts: {
                path: 'halo/plugin/contacts'
            },
            pay: {
                path: 'halo/plugin/pay'
            }
        }
    }
});

})();