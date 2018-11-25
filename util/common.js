/* ************************************
 * common 常规工具
 * ************************************/
;(function (c) {
    'use strict';

    c.common = {

        /**
         * 数组/对象遍历
         * @param obj {Array|Object} 数组/对象
         * @param each {function(val, key):?boolean} 处理器
         */
        each: function (obj, each) {
            if (c.valid.isArray(obj)) {
                for (var i = 0, len = obj.length; i < len; i++)
                    if (false === c.common.apply(each, obj[i], obj[i], i))
                        break;
            }
            else {
                for (var i in obj)
                    if (false === c.common.apply(each, obj[i], obj[i], i))
                        break;
            }
        },

        /**
         * 执行函数
         * @param fn {Function} 函数
         * @param [ctxt] {Object} 执行上下文
         * @param [psn] {*} 执行参数, param_1, param_2, ...param_n
         * @return {*|Object|void} 执行结果
         */
        apply: function (fn, ctxt, psn) {
            if (c.valid.isFunction(fn))
                return fn.apply(ctxt, Array.prototype.slice.call(arguments, 2));
        },

        /**
         * 依赖于 fontawesome 实现 loading 幕布
         * @param show {boolean} undefined|true-显示, false-隐藏
         * @param $container 需要遮盖的容器, 默认 $body
         */
        loading: function (show, $container) {
            $container = $($container);
            var $head = $("head");
            if (!$container.length)
                $container = $("body");

            if (!$head.find("#loading-link").length) {
                var css = ".loading-body{overflow:hidden; position:relative; pointer-events:none;}" +
                    ".loading-screen{position:absolute;top:0;left:0;width:100%;height:100%;opacity:.2;background:#000;z-index:999999999;}" +
                    ".c{position:absolute;top:50%;left:50%;text-align:center;color:#FFF;z-index:999999999;font-size:1.5rem;}" +
                    // ".c:after{content:'加载中';display:block;}" +
                    ".loading-screen .fa{font-size:28px;}";
                $("<style>", {id: "loading-link"}).text(css).appendTo($head);
            }
            if (!$container.find(".loading-screen").length) {
                var
                    screen = $("<div>").addClass("loading-screen").appendTo($container),
                    content = $("<div>").addClass("c").appendTo(screen);
                $("<i>").addClass("fa fa-spinner fa-pulse fa-3x fa-fw margin-bottom").appendTo(content);
            }

            if (undefined === show || show)
                $container
                    .addClass("loading-body")
                    .find(".loading-screen").show();
            else
                $container
                    .removeClass("loading-body")
                    .find(".loading-screen").hide();
        },

        /**
         * 获取请求路径
         * @param useFirstDir {Boolean} truth-使用location.path第一个查询路径
         * @param path {String} 需要追加的路径
         * @return {string} 完整请求地址
         */
        requestUrl: function (useFirstDir, path) {
            if (self.fullUrl(path))
                return path;

            path = self.getRelativePath(path);
            var
                base = location.origin + "/",
                url = base,
                mather = location.pathname.match(/[^\/\\]+/);
            var index = path.indexOf(location.origin);
            if (-1 !== index)
                path = path.substr(location.origin.length);
            if (useFirstDir && mather)
                url += self.getRelativePath(mather[0]) + "/";
            return url + path;
        },

        /**
         * arguments 转成数组
         * @param args {Object} arguments
         * @returns {Array}
         */
        argumentsAsArray: function (args) {
            var ret = [];
            // for (var i = 0, l = args.length; i < l; i++)
            //     ret.push(args[i]);
            ret.push.apply(ret, args);
            return ret;
        },

        /**
         * 计时器
         * @param invoker {function()} 执行函数
         * @param [time=20] {Number} 间隔时间
         * @param [loop=false] {Boolean} true-循环执行
         * @return {function()} true===loop, 执行返回函数后停止
         */
        timer: function (invoker, time, loop) {
            var id = setInterval(function () {
                if (true !== loop)
                    clearInterval(id);
                c.common.apply(invoker);
            }, isNaN(time) ? 20 : time);

            return function () {
                clearInterval(id);
            }
        },

        /**
         * 简单遍历
         * @param start {Number|*} 开始值(包含)
         * @param step=1 {Number|function(prev):next|undefined|null} 下个值, 返回null/undefined终止. 如果start是对象该值必须是函数
         * @param [end=0] {Number|*} 结束值(不包含), 如果start是对象该值为处理器函数
         * @param fn {function(val):boolean} 处理函数, 返回false终止
         */
        forNext: function (start, step, end, fn) {
            if (c.valid.nullOrUndefined(start))
                return;

            var byNumber = c.valid.isNumber(start);
            if (byNumber) {
                if (start > end) {
                    for (; start > end; start -= step)
                        if (false === c.common.apply(fn, start, start))
                            break;
                } else {
                    for (; start < end; start += step)
                        if (false === c.common.apply(fn, start, start))
                            break;
                }
                return;
            }

            // 对象必须使用函数来处理
            if (!c.valid.isFunction(step))
                throw 'start为对象时, step必须为函数';
            if (c.valid.isFunction(end)) {
                fn = end;
                end = null;
            }
            do {
                if (false === c.common.apply(fn, start, start))
                    break;
                start = c.common.apply(step, start, start)
            } while (!c.valid.nullOrUndefined(start));

        },

        /**
         * 生成GUID
         * @param toUpperCase {boolean} true-转换为大写, 默认为小写
         * @param notSeparator {boolean} true-删除分隔符,仅保留字母数字
         * @returns {string} GUID字符串
         */
        uuid: function (toUpperCase, notSeparator) {
            var s = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            if (toUpperCase) s = s.toUpperCase();
            if (notSeparator) s = s.replace(/(-)/g, '');
            return s;

            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
        }
    };

})(window.jsu = (window.jsu || {}));


/* ************************************
 * objects 对象工具集
 * ************************************/
(function (c) {
    'use strict';

    c.objects = ({

        /**
         * 对象数据克隆
         * @param obj {object|Array} 目标对象
         * @param [useful=false] {boolean} true-只保留非{@link null}和{@link undefined}值
         * @return {*} 被克隆数据
         */
        clone: function (obj, useful) {
            if (!c.valid.isObject(obj)) return obj;
            var co = JSON.parse(JSON.stringify(obj));
            if (useful)
                c.common.each(co, function (v, k) {
                    if (null === v || undefined === v)
                        delete co[k];
                });
            return co;
        },

        /**
         * 属性复制
         * @param src {object} 数据来源
         * @param [useful=false] {boolean} true-只保留非{@link null}和{@link undefined}值
         * @param [dest={}] {object} 目标对象
         * @return {*|{}}
         */
        copyProps: function (src, dest, useful) {
            dest = dest || {};
            c.common.each(c.objects.clone(src, useful), function (v, k) {
                dest[k] = v;
            });
            return dest;
        },

        /**
         * ognl属性还原为对象
         * @param data 源数据
         * @return {object} 还原后对象
         */
        parseOgnlAttrs: function (data) {
            var ret = {};
            c.common.each(data, function (v, k) {
                c.ognl.setValue(k, v, ret);
            });
            return ret;
        },

        /**
         * 展开对象为一级属性
         * @param o {object} 源数据
         * @param skipNullOrUndef=true {boolean} 过滤null&undefined值
         * @param ret={} {object} 保存展开属性
         * @return {*} 只包含一级属性的对象
         */
        asPrimary: function (o, skipNullOrUndef, ret) {
            skipNullOrUndef = true || (undefined === skipNullOrUndef);
            ret = ret || {};
            ext(this.clone(o), null, ret);
            return ret;

            function ext(json, prefix, ret) {
                var isArr = c.valid.isArray(json);
                c.common.each(json, function (v, k) {
                    if (skipNullOrUndef && (c.valid.nullOrUndefined(v) || '' === v))
                        return true;

                    // 数组或数字属性名都是用中括号'[]'
                    var nk;
                    if (isArr || !isNaN(k)) nk = prefix ? (prefix + "[" + k + "]") : k;
                    else nk = prefix ? (prefix + "." + k) : k;

                    // 赋值
                    if (!c.valid.isObject(v)) ret[nk] = v;
                    else ext(v, nk, ret);
                });
                return ret;
            }
        },

        /**
         * 展开对象一级属性(排除函数)并保存到对象数组中
         * @param o {Object} 对象
         * @param keyName {String} 用于保存对象属性名的数组项属性名
         * @param valueName {String} 用于保存对象属性值的数组项属性名
         * @return {Array|null} 一级属性对象数组, [{keyName:key_1, valueMame:value_1}...{keyName:key_n, valueMame:value_n}]
         */
        asArrayByFirstProperty: function (o, keyName, valueName) {
            if (c.valid.isObject(o)) {
                var ret = [];
                c.common.each(o, function (v, k) {
                    var el = {};
                    el[keyName] = k;
                    el[valueName] = v;
                    ret.push(el)
                });
                return ret;
            } else {
                return null;
            }
        },

        /**
         * 获取对象值列表
         * @param o {Object} 对象
         * @param keys {String|Array|function(v,k,o)|undefined} 属性名(列表), 或滤函数返回true, 或不指定获取所有属性值
         * @return {Array} 值列表
         */
        values: function (o, keys) {
            if (c.valid.isString(keys))
                keys = [keys];

            var filter;
            if (c.valid.isArray(keys))
                filter = function (v, k, o) {
                    return -1 !== keys.indexOf(k);
                };
            if (!c.valid.isFunction(filter))
                keys = function () {
                    return true;
                };

            var ret = [];
            c.common.each(o, function (v, k) {
                if (false !== filter(v, k, o))
                    ret.push(v);
            });
            return ret;
        },

        /**
         * 获取对象键列表
         * @param {Object|Array} o 对象
         * @param {Function} [fn] 前置处理器, 参数:v, k, o, 返回值:false-跳过
         * @return {Array} 键列表
         */
        keys: function (o, fn) {
            var keys = [];
            c.common.each(o, function (v, k) {
                if (false !== c.common.apply(fn, o, v, k, o))
                    keys.push(k);
            });
            return keys;
        },

        /**
         * 获取第一个与v相同值的key
         * @param o {Object} 对象
         * @param v {Object|function(ov:*):boolean} 参考值, 或函数返回true表示找到
         * @return {undefined|*} 第一个匹配到的属性名(与顺序无关)
         */
        getKeyByValue: function (o, v) {
            if (c.valid.nullOrUndefined(o))
                throw '参数o不是Object类型';

            var predicate = v;
            if (c.valid.nullOrUndefined(v))
                predicate = function (ov) {
                    return c.valid.nullOrUndefined(ov);
                };
            else if (!c.valid.isFunction(v))
                predicate = function (ov) {
                    return ov === v;
                };

            var ret = undefined;
            c.common.each(o, function (ov, k) {
                if (true === predicate(ov)) {
                    ret = k;
                    return false;
                }
            });
            return ret;
        }

    });
})(window.jsu = (window.jsu || {}));


/* ************************************
 * $common jQuery增强工具
 * ************************************/
(function (c) {
    'use strict';

    c.$common = {

        /**
         * 获取指定控件盒模型
         * @param $el
         * @return {{$el: *, offset: (*|{left, top}|{top, left}), position: (*|{top, left}), width, realWidth: *, boxWidth: *, height, realHeight: *, boxHeight: *}}
         */
        box: function ($el) {
            $el = $($el);
            return {
                $el: $el,
                offset: $el.offset(),
                position: $el.position(),

                width: $el.width(),
                realWidth: $el.outerWidth(),
                boxWidth: $el.outerWidth(true),

                height: $el.height(),
                realHeight: $el.outerHeight(),
                boxHeight: $el.outerHeight(true),

                padding: {
                    top: parseInt($el.css("padding-top")),
                    right: parseInt($el.css("padding-right")),
                    bottom: parseInt($el.css("padding-bottom")),
                    left: parseInt($el.css("padding-left")),
                    asStyle: function () {
                        var unit = "px ";
                        return this.top + unit + this.right + unit + this.bottom + unit + this.left + unit;
                    }
                },
                margin: {
                    top: parseInt($el.css("margin-top")),
                    right: parseInt($el.css("margin-right")),
                    bottom: parseInt($el.css("margin-bottom")),
                    left: parseInt($el.css("margin-left")),
                    asStyle: function () {
                        var unit = "px ";
                        return this.top + unit + this.right + unit + this.bottom + unit + this.left + unit;
                    }
                }
            };
        },

        /**
         * 注册唯一委托事件
         * @param ctxt {jQuery} 被委托对象
         * @param selector {String} 选择器
         * @param events {String} 事件名, 多个事件使用空格分割
         * @param fn {Function} 事件处理器
         * @returns 被委托对象
         */
        uniqueDelegate: function (ctxt, selector, events, fn) {
            ctxt = $(ctxt);
            if (!c.valid.isJQuery(ctxt)) throw new Error("Delegatable must be instance of jQuery");
            ctxt.undelegate(selector, events);
            if (c.valid.isFunction(fn))
                ctxt.delegate(selector, events, fn);
            return ctxt;
        },

        /**
         * 阻止事件冒泡
         * @param e {Object} 事件对象
         */
        stopPropagation: function (e) {
            c.common.apply(e.stopPropagation, e);
        },

        /**
         * 一个或一组字符串转换为同级关联样式类
         * @param arguments 目标字符串(s), 或s1, s2, ...SN
         * @returns {string}
         */
        asClass: function () {
            var cls = "";
            var ps = c.common.argumentsAsArray(arguments);
            c.common.each(ps, function (v) {
                var s = (v + "").replace(/\s+/g, ".");
                s = s.replace(/\.+/g, ".");
                if (0 === s.indexOf(".")) s = s.substr(1);
                cls += "." + s;
            });
            return cls;
        },

        _elCreatorReady: false,
        /**
         * 使用jQuery创建元素
         * @returns {jQuery}
         */
        get els() {
            if (this._elCreatorReady) return this._els;
            this._elCreatorReady = true;
            var watchProps = {};
            c.common.each(
                [
                    "a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "big",
                    "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "command",
                    "datalist", "dd", "del", "details", "div", "dfn", "dialog", "dl", "dt", "em", "embed", "fieldset",
                    "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "head", "header", "hr", "html",
                    "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "map",
                    "mark", "menu", "menuitem", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup",
                    "option", "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "samp", "script",
                    "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table",
                    "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "ul",
                    "var", "video", "wbr"
                ],
                function (v) {
                    watchProps[v] = {
                        get: function () {
                            return $("<" + v + ">");
                        }
                    }
                }
            );

            var data = {};
            Object.defineProperties(data, watchProps);
            Object.defineProperty(this, "_els", {value: data});
            return data;
        },

        /**
         * 填充select控件
         * @param name {String} name属性值
         * @param value {String} 填充完成后选中值
         * @param options {Array<{text, value}>} 选项数据, text-选项文本, value-选项值
         * @param [$select] {jQuery} select控件包装对象, 如果为null使用全新select控件
         * @return {*} $select控件
         */
        selectFill: function (name, value, options, $select) {
            if (!c.valid.isJQuery($select))
                $select = $('<select>');
            if (!/^select$/ig.test($select[0].tagName))
                throw '参数 $select 不是html select控件';

            $select.html('').attr({name: name});
            c.common.each(options, function (opt) {
                $('<option>', {html: opt.text, value: opt.value}).appendTo($select);
            });
            return $select.val(value);
        }
    };

})(window.jsu = (window.jsu || {}));


/* ************************************
 * strings 字符串工具集
 * ************************************/
(function (c) {
    'use strict';
    c.strings = {

        /**
         * 重复指定字符
         * @param s {Number|Boolean|String} 字符串
         * @param times {Number} 重复次数
         * @return {string} 结果字符串
         */
        repeat: function (s, times) {
            if (c.valid.isFunction(Array.prototype.fill)) {
                var arr = new Array(times);
                arr.fill(s, 0);
                return arr.join('');
            }

            var ret = '';
            while (--len >= 0) ret += s;
            return ret;
        },

        /**
         * 去除指定字符串两端空格
         * @param s {String|*} 目标字符串, undefined|null总是返回空字符串
         * @return {*} 两端无空白字符串
         */
        trim: function (s) {
            if (c.valid.nullOrUndefined(s))
                return '';

            s += '';
            if (c.valid.isFunction(s.trim))
                return s.trim();
            return $.trim(s);
        }
    };
})(window.jsu = (window.jsu || {}));


/* ************************************
 * arrays 数组工具集
 * ************************************/
(function (c) {
    'use strict';
    c.arrays = {

        /**
         * 从数据中移除元素
         * @param arr {Array} 源数组
         * @param el {object|Array} 要移除的元素
         * @param [predicate] {string|function(object, object):boolean} 断言字段名或函数(true-移除)
         * @return {Array} 被移除的元素
         */
        remove: function (arr, el, predicate) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");
            if (!c.valid.isArray(el)) el = [el];

            var p = predicate;
            if (c.valid.isString(predicate))
                p = function (el1, el2) {
                    return el1[predicate] === el2[predicate];
                };
            if (!c.valid.isFunction(p))
                p = function (a, b) {
                    return a === b;
                };

            var delIdxs = [];
            c.common.each(el, function (v) {
                c.common.each(arr, function (v1, i) {
                    if (p(v, v1)) {
                        delIdxs.push(i);
                        return false;
                    }
                });
            });
            delIdxs.sort();
            delIdxs.reverse();
            var ret = [];
            c.common.each(delIdxs, function (delIdx) {
                ret.push(arr.splice(delIdx, 1)[0]);
            });
            ret.reverse();
            return ret;
        },

        /**
         * 追加元素
         * @param arr {Array} 源数组
         * @param el {object|Array} 追加的元素
         * @param [distinct=true] {boolean} true-保证数据元素唯一性
         * @return {Array} 源数组
         */
        push: function (arr, el, distinct) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");
            if (!c.valid.isArray(el)) el = [el];
            Array.prototype.push.apply(arr, el);
            if (distinct || c.valid.nullOrUndefined(distinct))
                c.arrays.unique(arr);
            return arr;
        },

        /**
         * 确保数组元素唯一性
         * @param arr {Array} 数组
         * @param [k] {string} 匹配属性
         * @return {Array} 源数组
         */
        unique: function (arr, k) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");

            if (!c.valid.nullOrUndefined(k)) {
                var map = {}, kmap = {};
                c.common.each(arr, function (v, i) {
                    var val = v[k];
                    map[val] = v;
                    kmap[val] = i;
                });

                return c.common.values(map);
            }


            var tmp = [];
            c.common.each(arr, function (v) {
                if (-1 === tmp.indexOf(v)) tmp.push(v);
            });
            arr.length = 0;
            Array.prototype.push.apply(arr, tmp);
            return arr;
        },

        /**
         * 提取每个元素的值
         * @param arr {Array} 目标数组
         * @param prop {string} 属性名
         * @return {Array} 属性值列表
         */
        extValues: function (arr, prop) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");
            var ret = [];
            c.common.each(arr, function (v) {
                ret.push(v[prop]);
            });
            return ret;
        },

        /**
         * 获取数组元素最大值
         * @param arr {Array} 目标数组
         * @param [key] {String} key-元素属性, 如果不指定则直接比较两个元素; 如果元素不是{number}类型, 返回NaN
         * @return {number} 最大值
         */
        max: function (arr, key) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");
            var ret = null;
            c.common.each(arr, function (data) {
                ret = Math.max(ret, +(key ? data[key] : data));
            });
            return ret;
        },

        /**
         * 查找指定值在数组中的位置
         * @param ps
         * @param ps.list {Array} 目标数组
         * @param ps.value {object} 要匹配的值
         * @param [ps.key] {String} 属性名, 支持OGNL表达式
         * @return {number}
         */
        indexOf: function (ps) {
            if (!c.valid.isArray(ps.list)) throw new Error("参数 arr 不是一个数组");
            var index = -1;
            c.common.each(ps.list, function (el, k) {
                var v = ps.key ? el[ps.key] : el;
                if (ps.value === v) {
                    index = k;
                    return false;
                }
            });
            return index;
        },

        /**
         * 展开数组, 并展开为一级属性(带下表)
         * @param conf {Object} 配置
         * @param conf.prefix {String} 参数前缀, VO对象属性名; 仅对conf.list数组元素有效
         * @param conf.list {Array} 对象数组
         * @param [conf.useAll=false] {boolean} true-递归展开所有数组元素, 前缀为属性名
         * @param [conf.suffix] {String} 属性后缀; 仅对conf.list数组元素有效
         * @param [conf.keysAlias] {{key:value}} key-源数姓名, value:目标数姓名 别名属性;非空时仅保留别名中包含的属性
         * @param [conf.each] {function(data, index)} 为每个元素提供转换之前修改数据的能力
         * @return {Object} HTML请求参数, eg.{conf.prefix[i]:value, ...}
         */
        asPrimaryKey: function (conf) {
            if (!c.valid.isArray(conf.list)) throw new Error("参数conf.list不是一个数组");
            var
                data = {},
                suffix = c.valid.nullOrUndefined(conf.suffix) ? "" : ("." + conf.suffix);

            c.common.each(conf.list, function (d, index) {
                if (!d) return true;
                c.common.invoke(data, conf.each, d, index);
                var pre = conf.prefix + "[" + index + "]";

                // 一级属性
                if (c.valid.isObject(d)) {
                    data[pre + suffix] = d;
                    return true;
                }

                // 二级属性
                c.common.each(d, function (v, k) {
                    if (c.valid.isObject(conf.keysAlias)) k = conf.keysAlias[k];
                    if (!k) return true;
                    var fk = pre + "." + k + suffix;
                    data[fk] = v;
                });
            });
            if (!conf.useAll) return data;
            findAll();
            return data;

            function findAll() {
                var found = false;
                c.common.each(data, function (v, k) {
                    if (c.valid.isArray(v)) {
                        found = true;
                        delete data[k];
                        var cd = c.arrays.asPrimaryKey({
                            prefix: k,
                            list: v
                        });
                        c.objects.copyProps(cd, data, true);
                    }
                });
                if (found) findAll();
            }
        },

        /**
         * 对象数组转换为对象映射关系
         * @param arr {Array} 对象数组
         * @param key {String} 元素属性名,不指定时使用下标代替
         * @param [defIndex=true] {boolean} true|undefined-属性名不存在时使用下标代替, false-跳过
         * @return {Object} 对象映射关系
         */
        asMap: function (arr, key, defIndex) {
            if (!c.valid.isArray(arr)) return {};
            var
                map = {},
                notKey = c.valid.nullOrUndefined(key),
                useIndex = (defIndex || (undefined === defIndex)) ? true : defIndex;
            c.common.each(arr, function (d, index) {
                // 未指定key, 直接使用下标作为索引
                if (notKey) map[index] = d;
                // key存在, 使用key指定的value作为索引
                else if (key in d) map[c.ognl.getValue(d, key)] = d;
                // key不存在但允许使用下标作为索引
                else if (useIndex) map[index] = d;
            });
            return map;
        },

        /**
         * 数组排序
         * @param arr {Array} 目标数组
         * @param [key=undefined] {String|number|null|undefined} 用于排序的key, 默认不使用
         * @return {*} 排序后的数组
         */
        sortBy: function (arr, key) {
            if (!c.valid.isArray(arr)) throw new Error("参数 arr 不是一个数组");
            var matchEl = c.valid.nullOrUndefined(key);
            arr.sort(function (a, b) {
                if (matchEl) return a - b;
                else return c.ognl.getValue(a, key) - c.ognl.getValue(b, key);
            });
            return arr;
        },

        /**
         * 去除元素两端空白字符(注意: 该函数会将所有元素转换为字符串)
         * @param arr {Array<String>} 字符串数组
         * @param [after] {function(_el, index, el):*} 后置处理器, 返回元素值
         * @return {*} 参数arr
         */
        trims: function (arr, after) {
            if (!c.valid.isArray(arr))
                throw '参数arr不是Array实例';
            c.common.each(arr, function (el, index) {
                var
                    _el = c.strings.trim(el),
                    newlyEl = c.common.apply(after, _el, _el, index, el);
                _el = c.valid.nullOrUndefined(newlyEl) ? _el : newlyEl;
                arr.splice(index, 1, _el);
            });
            return arr;
        },

        /**
         * 添加或移除指定数组元素
         * @param arr {Array} 数组对象
         * @param el {*} 指定元素(存在执行删除, 不存在就添加)
         * @return {number} el在arr修改前的位置, 如果不存在返回-1
         */
        toggle: function (arr, el) {
            if (!c.valid.isArray(arr))
                throw '参数arr不是数组';

            var index = arr.indexOf(el);
            if (-1 === index)
                arr.push(el);
            else
                c.arrays.remove(arr, el);
            return index;
        },

        /**
         * 校验指定对象是否存在数组中
         * @param arr {Array} 数组
         * @param el {Object|function(ele:*,index:number):?boolean} Object类型使用'===比较, Function返回true表示找到
         * @param [predicate] {string|function(ele:*,index:number):?boolean} string类型指定比较的属性名, Function返回true表示找到
         * @return {boolean} true-存在, false-不存在
         */
        contains: function (arr, el, predicate) {
            if (!c.valid.isArray(arr))
                throw '参数arr不是Array实例';

            // 未指定el修复
            if (c.valid.isFunction(el)) {
                predicate = el;
                el = {};
            }

            // 使用断言属性名
            if (c.valid.isString(predicate)) {
                var
                    key = predicate,
                    inEl = (key in el);
                predicate = function (ele) {
                    return c.valid.isObject(ele) && (key in ele) && inEl && (ele[key] === el[key]);
                };
            }

            // 未指定断言函数
            // 默认断言函数
            if (!c.valid.isFunction(predicate))
                predicate = function (ele) {
                    return ele === el;
                };

            var exist = false;
            c.common.each(arr, function (ele, index) {
                if (true === predicate(ele, index)) {
                    exist = true;
                    return false;
                }
            });
            return exist;
        },

        /**
         * 翻转数组
         * @param arr {Array|null|undefined} 数组
         * @param newly {boolean} true-使用新数组作为返回值
         * @param allowEmpty {boolean} true-允许接受null|undefined
         * @return {*} 翻转后数组
         */
        reverse: function (arr, newly, allowEmpty) {
            if (!c.valid.isArray(arr)) {
                if (allowEmpty)
                    return [];
                else
                    throw '参数arr不是Array实例';
            }

            var ret = c.arrays.push([], arr);
            ret.reverse();
            if (newly) return ret;

            arr.length = 0;
            return c.arrays.push(arr, ret);
        }
    };
})(window.jsu = (window.jsu || {}));


/* ************************************
 * dates 日期工具, 提供格式化日期对象、按规则解析日期字符串、格式化毫秒值等操作
 * ************************************/
(function (c) {
    'use strict';
    c.dates = {
        /**
         * 日期格式化
         * @param date {Date} 日期对象
         * @param format {String} 格式化规则(yyyyMMddhhmmssS), 默认:"yyyy-MM-dd hh:mm:ss:S"
         * @returns {String} 格式化日期字符串
         */
        format: function (date, format) {
            function formatter(format) {
                format = (format || "yyyy-MM-dd hh:mm:ss");
                var time = this.getTime();
                if (isNaN(time)) {
                    return;
                }
                var o = {
                    "M+": this.getMonth() + 1,
                    "d+": this.getDate(),
                    "h+": this.getHours(),
                    "m+": this.getMinutes(),
                    "s+": this.getSeconds(),
                    "q+": Math.floor((this.getMonth() + 3) / 3),
                    "S": this.getMilliseconds()
                };

                if (/(y+)/.test(format))
                    format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));

                for (var k in o)
                    if (new RegExp("(" + k + ")").test(format))
                        format = format.replace(RegExp.$1, RegExp.$1["length"] === 1
                            ? o[k]
                            : ("00" + o[k]).substr(("" + o[k]).length));
                return format;
            }

            if (c.valid.nullOrUndefined(date)) return null;
            if (c.valid.isNumber(date)) date = new Date(+date);
            if (!c.valid.isDate(date)) throw "Error Type: Parameters 'date' must be a date type";
            return formatter.call(date, format);
        },

        /**
         * 当前日期格式化
         * @param format {String} 格式化规则(yyyyMMddhhmmssS), 默认:"yyyy-MM-dd hh:mm:ss:S"
         * @returns {String} 格式化日期字符串
         */
        formatNow: function (format) {
            return c.dates.format(new Date(), format);
        },

        /**
         * 日期字符串解析
         * @param dateStr {String} 格式化字符串
         * @param pattern {String} 日期格式化规则
         * @returns {Date|null} 解析成功返回日期对象, 否则返回null
         */
        parse: function (dateStr, pattern) {
            return c.dates.parser.apply(new Date(), arguments);
        },

        /**
         * 解析器必须在{@link Date}环境中使用
         * @param dateStr 日期字符串
         * @param pattern 解析规则: yMdHmsS
         * @returns {Date|null} 解析成功返回日期对象, 否则返回null
         */
        parser: function (dateStr, pattern) {
            var metaPatterns = {
                /**
                 * 元规则决策表, 每项决策中会新增三个属性:
                 * <p>
                 * beginIndex: {Number}<br>
                 * pLength: {Number}<br>
                 * original: {String}
                 * </p>
                 */
                metas: {
                    /** 年规则 */
                    y: {
                        name: "Year", setYear: function (date) {
                            date.setFullYear(this.original || 0);
                        }
                    },
                    /** 月规则 */
                    M: {
                        name: "Month", setMonth: function (date) {
                            date.setMonth(isNaN(this.original) ? 0 : (this.original - 1));
                        }
                    },
                    /** 月中的天数规则 */
                    d: {
                        name: "Day", setDay: function (date) {
                            date.setDate(this.original || 0);
                        }
                    },
                    /** 小时规则 */
                    h: {
                        name: "Hour", setHour: function (date) {
                            date.setHours(this.original || 0);
                        }
                    },
                    /** 分钟规则 */
                    m: {
                        name: "Minute", setMinute: function (date) {
                            date.setMinutes(this.original || 0);
                        }
                    },
                    /** 秒规则 */
                    s: {
                        name: "Second", setSecond: function (date) {
                            date.setSeconds(this.original || 0);
                        }
                    },
                    /** 毫秒规则 */
                    S: {
                        name: "Millisecond", setMillisecond: function (date) {
                            date.setMilliseconds(this.original || 0);
                        }
                    }
                },

                /**
                 * 设值
                 * @param date {Date|*} 目标日期
                 * @returns {Date} 修改后日期
                 */
                setValues: function (date) {
                    this.metas.y.setYear(date);
                    this.metas.M.setMonth(date);
                    this.metas.d.setDay(date);
                    this.metas.h.setHour(date);
                    this.metas.m.setMinute(date);
                    this.metas.s.setSecond(date);
                    this.metas.S.setMillisecond(date);
                    return date;
                },

                /**
                 * 校验器
                 * @param orgiDateStr {String} 日期字符串
                 * @param tgtPattern {String} 解析规则
                 * @returns {Boolean} true-解析成功, false-规则不能匹配日期字符串
                 */
                validate: function (orgiDateStr, tgtPattern) {
                    var
                        NUMBER_PATTERN = "\\d",
                        MX_PATTERN = "\\d+",
                        replacedPattern = (tgtPattern || "") + "";
                    if (!replacedPattern) return false;

                    // 记录当前所能支持的所有元字符
                    var metasStr = [];
                    c.common.each(this.metas, function (v, key) {
                        metasStr.push(key);
                    });

                    // 替换pattern中年月日时分秒的字符为\d
                    replacedPattern = replacedPattern.replace(/\//g, "\\/");
                    c.common.each(metasStr, function (meta) {
                        replacedPattern = replacedPattern.replace(eval("(/" + meta + "/g)"), "S" === meta ? MX_PATTERN : NUMBER_PATTERN);
                    });
                    replacedPattern = replacedPattern.replace(/\\\\/g, "\\").replace(/[\/]/g, "\/");

                    // 使用替换后的pattern校验dateStr是否有效
                    var result = eval("(/^" + replacedPattern + "$/)").test(orgiDateStr);
                    if (result) {
                        var _this = this;
                        // 校验通过, 按顺序设置元规则开始索引和值
                        // > 按元规则分组
                        var metasGroup = metasStr.join("");
                        // /([yMdhms])\1*/g: 提取的元规则
                        var groupRegExp = eval("(/([" + metasGroup + "])\\1*/g)");
                        // 替换掉日期字符串分隔符字符
                        var onlyNumberDateStr = orgiDateStr.replace(/[^\d]+/g, "");
                        // 把原pattern中的年月日时分秒解为有序的正则表达式数组,
                        var orgiValIdx = 0;
                        c.common.each(tgtPattern.match(groupRegExp), function (metaGroup) {
                            // :> 设置每个组的 beginIndex, pLength, original
                            var meta = _this.metas[metaGroup[0]];
                            meta.beginIndex = tgtPattern.indexOf(metaGroup);
                            meta.pLength = metaGroup.length;
                            if ("S" !== metaGroup[0])
                                meta.original = onlyNumberDateStr.substring(orgiValIdx, (orgiValIdx + meta.pLength));
                            else
                                meta.original = onlyNumberDateStr.substring(orgiValIdx);
                            orgiValIdx += meta.pLength;
                        });
                    }
                    return result;
                }
            };

            // 解析完成后按Date构造顺序构建目标Date对象
            var success = metaPatterns.validate(dateStr, pattern);
            if (success) {
                metaPatterns.setValues(this);
                return this;
            }
            return null;
        },

        /**
         * 毫秒值转换
         * @param ms {number} 毫秒值
         * @return {{ms: number, s: number, m: number, h: number, d: number}}
         */
        convertDay: function (ms) {
            ms = Math.abs(+ms);
            var data = {ms: ms % 1000, s: 0, m: 0, h: 0, d: 0};
            data.ms = ms % 1000;
            data.s = parseInt(Math.floor(ms / 1000 % 60) + "");
            data.m = parseInt(Math.floor(ms / 1000 / 60 % 60) + "");
            data.h = parseInt(Math.floor(ms / 1000 / 60 / 60 % 60) + "");
            data.d = parseInt(Math.floor(ms / 1000 / 60 / 60 / 24) + "");
            return data;
        },

        /**
         * 获取当前毫秒值
         * @return {number} 毫秒值
         */
        get currentTime() {
            return new Date().getTime();
        }
    };
})(window.jsu = (window.jsu || {}));


/* ************************************
 * ognl 对象属性导航工具, 提供设值/取值操作
 * ************************************/
(function (c) {
    'use strict';
    c.ognl = {

        /**
         * 设置属性值
         * @param v {object} 值
         * @param k {string} ognl索引
         * @param d {object} 目标对象
         */
        setValue: function (v, k, d) {
            if (!(d instanceof Object)) return;
            var ognl = new c.ognl.Ognl(k), tmp;

            // 数组
            if (ognl.isArray) {
                // 第一层数组直接赋值
                // 所以 ognl.floors 需要去掉一层
                var old = d[ognl.key];
                var arr, lastIndex, fIndex = ognl.floors.shift();

                if (!c.valid.isArray(old))
                    arr = d[ognl.key] = [];
                else {
                    arr = old;
                    var existLen = arr.length, offset = existLen - fIndex - 1;
                    // 目标下表超出现有数组长度
                    // 执行下表补位
                    if (0 > offset) {
                        offset = Math.abs(offset);
                        while (0 < offset--)
                            arr.push(undefined);
                    }
                    arr.splice(fIndex, 1, []);
                }

                // 第N层(N>1)
                for (var i in ognl.floors) {
                    var index = lastIndex = ognl.floors[i];
                    arr.splice(index, 1, tmp = []);
                    arr = tmp;
                }

                // 设置非数组维度的层级关系
                if (ognl.next) {
                    arr.splice(fIndex, 1, tmp = tmp || {});
                    this.setValue(v, ognl.nextKey, tmp);
                } else {
                    if (undefined !== lastIndex) arr.splice(lastIndex, 1, v);
                    else arr[fIndex].push(v);
                }
            }

            // 对象
            else {
                if (ognl.next) {
                    this.setValue(v, ognl.nextKey, d[ognl.key] = {});
                } else {
                    if (c.valid.isArray(d)) {
                        d.push(tmp = {});
                        d = tmp;
                    }
                    d[ognl.key] = v;
                }
            }

            return d;
        },

        /**
         * 获取属性值
         * @param data {Object} 数据对象
         * @param ognl {String} ognl表达式
         */
        getValue: function (data, ognl) {
            if (c.valid.nullOrUndefined(data))
                return null;
            if (!c.valid.isString(ognl))
                throw new Error("Invalid parameter: ognl");

            var keys = ognl.split(".");
            if (1 === keys.length) {
                // 非数组
                var regex = /\[/;
                if (!regex.test(ognl)) return data ? data[$.trim(ognl)] : data;
                else return c.ognl.getArrOgnlVal(data, ognl);
            }

            var
                idx = ognl.indexOf("."),
                key = ognl.substring(0, idx),
                isArr = /\[\d+\]/.test(key),
                d = isArr ? c.ognl.getArrOgnlVal(data, key) : data[key],
                newOgnl = ognl.substring(idx + 1);
            return c.ognl.getValue(d, newOgnl);
        },

        /**
         * 获取数组对象的值
         * @param data {Object} 数据对象
         * @param ognl {String} ognl表达式
         */
        getArrOgnlVal: function (data, ognl) {
            // 获取数组对象
            var sIdx = ognl.indexOf("["),
                arrK = ognl.substring(0, sIdx),
                arr = data[arrK],
                idxStr = ognl.substring(sIdx),
                idxReg = /^(\[\d+\])+$/;
            if (!idxReg.test(idxStr)) throw new Error("非法下标索引:" + idxStr);

            // 获取值[1], [0][2]...
            var idxes = idxStr.split("][");

            // 一维数组
            if (1 === idxes) return arr[parseInt(idxes.replace("[", "").replace("]", ""))];

            // 多维数组
            var val = arr;
            c.common.each(idxes, function (v) {
                if (!c.valid.isArray(val)) return false;
                val = val[parseInt((v + "").replace("[", "").replace("]", ""))]
            });
            return val;
        },

        /**
         * ONGL表达式解析对象
         * @param k {String} 表达式
         * @return {Ognl} 表达式对象
         * @constructor
         */
        Ognl: function Ognl(k) {
            if (!(this instanceof Ognl))
                return new Ognl(k);

            this.key = "";
            this.nextKey = "";
            this.isArray = false;
            this.floors = [];
            this.next = false;

            var
                objIndex = k.indexOf("."),
                arrIndex = k.indexOf("["),
                hasMore = (-1 !== objIndex);

            if (-1 !== arrIndex)
                if ((-1 === objIndex) || (arrIndex < objIndex))
                    this.isArray = true;

            if (hasMore) {
                this.key = k.substring(0, objIndex);
                this.nextKey = k.substring(objIndex + 1);
                this.next = new Ognl(k.substring(objIndex + 1));
            } else {
                this.key = k;
                this.next = null;
            }

            if (this.isArray) {
                var sp = this.key.split("[");
                this.key = sp.shift();
                for (var i in sp)
                    this.floors.push(parseInt(sp[i]));
            }

        }
    };
})(window.jsu = (window.jsu || {}));


/* ************************************
 * valid 校验工具, 支持javascript原生对象、HTML控件校验等s
 * ************************************/
(function (c) {
    var toString = Object.prototype.toString;
    c.valid = {
        // 原生对象检测
        isFunction: is('[object Function]'),
        isArray: is('[object Array]'),
        isDate: is('[object Date]'),
        isArguments: is('[object Arguments]'),
        isObject: is('[object Object]'),
        isString: is('[object String]'),
        isNumber: is('[object Number]'),
        isRegExp: is('[object RegExp]'),
        isTextNode: is('[object Text]'),

        nullOrUndefined: function (o) {
            return (null === o) || (undefined === o);
        },
        isJQuery: function (o) {
            return c.valid.isObject(o) && (o instanceof jQuery);
        },
        isCheckboxOrRadio: function (el) {
            el = $(el);
            return el.length && /input/i.test(el[0].tagName) && /radio|checkbox/i.test($(el).attr('type'));
        }
    };

    function is(v1) {
        return function (v2) {
            return v1 === toString.call(v2);
        };
    }

})(window.jsu = (window.jsu || {}));


/* ************************************
 * ajax 异步请求工具, 简单封装 $.ajax, 提供前置/后置拦截/loading支持
 * ************************************/
(function (c) {
    'use strict';
    c.$ajax = {

        /**
         * 发送Ajax请求, 自动检测跨域访问
         * @param conf {Object} 与jQuery.ajax参数相同,
         * @param [conf.done] {function()} success/error处理完成后调用,
         * @param [conf.loading] {boolean} 是否显示loading
         * @param [conf.loadingContainer] {jQuery|Element} loading-cover覆盖的区域
         */
        ajax: function (conf) {
            if (!c.valid.isObject(conf))
                conf = {};
            var url = $.trim(conf["url"]);
            if (!url) throw new Error("Missing required parameter[url][" + JSON.stringify(conf) + "]");

            if (c.$ajax.appName) {
                url = c.$ajax.appName + '/' + url;
                conf.url = url.replace(/\\+/g, '/').replace(/\/+/g, '/');
            }

            if (true === conf.loading)
                c.common.loading(true, conf.loadingContainer);

            var
                relativeUrl = (-1 === conf.url.indexOf(location.origin)),
                protocol = /^(http[s]?)|(ws:):/.test(url);
            if (conf.url && protocol && relativeUrl) {
                conf["type"] = "GET";
                conf["jsonp"] = "callback";
                conf["dataType"] = "jsonp";
            }

            if (!c.valid.isFunction(conf["error"]))
                conf["error"] = function () {
                    var args = c.common.argumentsAsArray(arguments);
                    args.unshift('error');
                    c.common.apply(c.$ajax.errorHandler, this, arguments);
                    done(conf);
                };

            if (false === c.common.apply(c.$ajax.beforeSend, c.$ajax, conf["data"])) {
                done(conf);
                return;
            }

            var sFn = conf["success"];
            conf["success"] = function (rData) {
                var args = c.common.argumentsAsArray(arguments);
                try {
                    if (c.valid.isFunction(sFn))
                        sFn.apply(this, args);
                } catch (e) {
                    args.unshift(e);
                    args.unshift('success');
                    c.$ajax.errorHandler.apply(this, args);
                }
                done(conf);
            };
            $.ajax(conf);
        },

        /**
         * 发送Ajax请求, POST请求方式, JSON响应格式
         * @param conf {Object} 与jQuery.ajax参数相同
         * @param conf.url {string} 请求地址
         * @param [conf.loading] {boolean] 是否启用Loading
         * @param [conf.loadingContainer] [jQuery] LoadingScreen 覆盖的区域
         * @param [conf.data] {Object} 请求数据
         * @param [conf.success] {function(res)] 成功处理函数
         * @param [conf.error] {function()} 失败处理函数
         */
        jsonAjax: function (conf) {
            conf = c.valid.isObject(conf) ? conf : {};
            conf["dataType"] = "JSON";
            conf["type"] = "POST";
            c.$ajax.ajax(conf);
        },

        /**
         * 请求发送前
         * @param param {Object} 请求参数
         * @returns false-阻止请求
         */
        beforeSend: function (param) {
        },

        /**
         * 每次请求并处理完成后(成功或失败)
         */
        done: function () {
        },

        /**
         * 错误处理
         */
        errorHandler: function () {
            var logger = c.Logger ? c.Logger('common') : null;
            if (logger) {
                if (arguments[1] instanceof Error)
                    logger.error(arguments[1]);
                logger.warn.apply(logger, arguments);
            }
        }
    };

    function done(conf) {
        c.common.loading(false, conf.loadingContainer);
        c.common.apply(conf['done'] || c.$ajax.done, c.$ajax);
    }

})(window.jsu = (window.jsu || {}));