/*
 * 该类为表单操作提供基础功能:
 *   - 获取表单数据对象: 将HTML表单转换为JSON对象
 *   - 设置(回填)表单数据: 将JSON对象数据设置到HTML表单项中
 *   - 数据校验: 按规则校验HTML表单数据合法性
 *     > 本地校验: 正则表达式、HTML数据类型
 *     > 远程校验: 同步校验
 */
;(function (c) {
    'use strict';
    c.Form = Form;
    Form.logger = c.Logger ? c.Logger('Form') : null;

    // K - Form Key
    // V - Form Configure
    Form.cache = Form.cache || {};

    /**
     * @constructor
     * @param el {Element} 表单容器
     * @param mvvn {boolean} mvvm模式
     * @param dev {boolean} 调试模式
     * @type {Form}
     */
    function Form(el, mvvm, dev) {
        if (!(this instanceof Form))
            return new Form(el, mvvm, dev);

        Form.logger = dev ? Form.logger : null;
        Form.logger && Form.logger.info('初始化Form对象完成', this);

        // 生成缓存Key
        Object.defineProperty(this, 'key', {
            value: new Date().getTime()
        });

        // 获取表单配置s
        var conf = getConf(this, mvvm, el);

        // 调试模式
        if (dev)
            Object.defineProperty(this, '[[conf]]', {
                value: conf
            });

        // 解析表单配置
        parseConf(conf, !!mvvm);
    }

    /**
     * 设置/获取表单数据
     * @param [data] {*} 需要回填的表单数据
     * @return {*} 表单数据, undefined - 表单回填时
     */
    Form.prototype.data = function (data) {
        if (!data) {
            var ret = getData(this);
            Form.logger && Form.logger.info('获取表单数据:', ret);
            return ret;
        } else {
            Form.logger && Form.logger.info('表单回填:', data);
            setData(this, data);
        }
    };

    /**
     * 清空表单数据
     * @return {{}} 请空前表单数据
     */
    Form.prototype.clear = function () {
        var
            conf = getConf(this),
            ret = this.data();
        conf.data = {};
        c.common.each(conf.items, function (item) {
            item.el.val('').prop('checked', false);
        });
        Form.logger && Form.logger.info('表单清空完成!');
        return ret;
    };

    /**
     * 恢复初始化表单数据
     * @return {{}} 恢复前表单数据
     */
    Form.prototype.restore = function () {
        var
            conf = getConf(this),
            ret = this.data();
        conf.data = {};
        c.common.each(conf.items, function (item) {
            item.el.val(item.defaultValue);
            item.el.prop('checked', item.defaultChecked);
        });

        // 如果开启mvvm模式, 通过强制获取数据来刷新 conf.data 的值
        if (conf.mvvm) {
            conf.mvvm = false;
            Object.assign(conf.data = {}, getData(this));
            conf.mvvm = true;
        }

        Form.logger && Form.logger.info('重置表单完成!');
        return ret;
    };

    /**
     * 刷新表单控件缓存
     */
    Form.prototype.refresh = function () {
        var conf = getConf(this);
        parseConf(conf);
    };

    /**
     * 表单验证
     * <pre>
     * <input name='name'
     *      data-regexp="/^\S{6,18}$/"
     *      data-regexp-error="密码长度6~18位"
     *
     *      data-eq="[name='pwd']"
     *      data-eq-error="两次密码输入不一致"
     *
     *      data-not-eq="[name='username']"
     *      data-not-eq-error="密码不能与用户名相同"
     *
     *      data-remote="/user/notExist"
     *      data-remote-error="用户名已存在"
     *      />
     * </pre>
     * @param [es] {Object} 回调事件
     * @param [es.success] {function({el, name, message, type}):boolean} 校验成功, 返回false停止校验
     * @param [es.failed] {function({el, name, message, type}):boolean} 校验失败, 返回false停止校验
     * @param [es.completed] {function({success:boolean, errors:[{el, name, message, type, success}...]})} 校验完成
     * @return {*} true-通过验证, false-验证失败(错误详情查看: es.failed/es.completed)
     */
    Form.prototype.validation = function (es) {
        es = es || {};
        var validRet = {
            success: true,
            errors: []
        };

        Form.logger && Form.logger.info('开始表单验证 >>>');

        // 本地校验
        var conf = getConf(this), skip, currentValid;
        c.common.each(conf.items, function (item) {

            // 排除 input: radio/checkbox
            if (c.valid.isCheckboxOrRadio(item.el)) return;
            currentValid = true;

            // Regexp校验
            var regexpRet = regexpValid(item);
            if (regexpRet) {
                validRet.success = validRet.success && regexpRet.success;
                if (!regexpRet.success) {
                    currentValid = false;
                    validRet.errors.push(regexpRet);
                    skip = (false === c.common.apply(es.failed, item, regexpRet));
                    if (skip) return false;
                }
            }

            // eq/notEq校验
            var referRet;
            if (c.valid.nullOrUndefined(regexpRet) || (regexpRet && regexpRet.success)) {
                if (referRet = referValid(item)) {
                    validRet.success = validRet.success && referRet.success;
                    if (!referRet.success) {
                        currentValid = false;
                        validRet.errors.push(referRet);
                        skip = (false === c.common.apply(es.failed, item, referRet));
                        if (skip) return false;
                    }
                }
            }

            // HTML校验
            var htmlRet;
            if (c.valid.nullOrUndefined(referRet) || (referRet && referRet.success)) {
                if (htmlRet = htmlValid(item)) {
                    validRet.success = validRet.success && htmlRet.success;
                    if (!htmlRet.success) {
                        currentValid = false;
                        validRet.errors.push(htmlRet);
                        skip = (false === c.common.apply(es.failed, item, htmlRet));
                        if (skip) return false;
                    }
                }
            }

            // 校验成功
            if (currentValid)
                c.common.apply(es.success, item, htmlRet)
        });

        // Remote校验
        // TODO 需要通过函数执行链来实现

        c.common.apply(es.completed, this, validRet);

        Form.logger && Form.logger.info('表单验证结束 <<<', validRet);
        return validRet;
    };

    /**
     * HTML 5 原生支持校验
     * @param item {*}
     * @return {null|{el: *, name: *, val: *, success: boolean, message: null}}
     */
    function htmlValid(item) {

        var el = item.el[0];
        if (!c.valid.isFunction(el.checkValidity)) {
            Form.logger && Form.logger.warn('当前客户端不支持HTML5表单校验');
            return null;
        }


        el.checkValidity();
        var ret = {
            el: item.el,
            name: item.name,
            val: item.el.val(),
            success: el.validity.valid,
            message: null
        };

        if (!ret.success) {
            c.common.each({
                pattern: {k: 'patternMismatch', e: '错误的数据'},
                max: {k: 'rangeOverflow', e: '超出最大值 ' + item.el.attr('max')},
                min: {k: 'rangeUnderflow', e: '超出最小值 ' + item.el.attr('min')},
                step: {k: 'stepMismatch', e: '值不符合由step属性指定的规则 *' + item.el.attr('step')},
                maxLength: {k: 'tooLong', e: '数据长度不能大于 ' + item.el.attr('maxLength')},
                minLength: {k: 'tooShort', e: '数据长度不能小于 ' + item.el.attr('minLength')},
                type: {k: 'typeMismatch', e: '元素的值不符合元素类型所要求的格式 ' + item.el.attr('type')},
                required: {k: 'valueMissing', e: '该项为必填项'}
            }, function (data, key) {
                if (undefined === item.el.attr(key)) return;
                if (el.validity[data.k]) {
                    ret.message = data.e;
                    return false;
                }
            });
        }

        return ret;
    }

    /**
     * 引用校验
     * @param item {*}
     * @return {{el: *, name: *, val: *, success: boolean, message: null}}
     */
    function referValid(item) {
        var
            executed = false,
            ret = {
                el: item.el,
                name: item.name,
                val: item.el.val(),
                success: true,
                message: null
            };

        var handlers = {
            eq: function (res) {
                if (c.valid.isString(res.val)) {
                    res.val = $.trim(res.val);
                    res.val = $(res.val);
                    res.val = c.valid.isJQuery(res.val) ? res.val : null;
                }

                if (c.valid.isJQuery(res.val)) {
                    executed = true;
                    ret.success = (res.val.val() === item.el.val());
                    ret.message = !ret.success ? res.message : null;
                }

                return ret.success;
            },
            notEq: function (res) {
                if (c.valid.isString(res.val)) {
                    executed = true;
                    res.val = $.trim(res.val);
                    res.val = $(res.val);
                    res.val = c.valid.isJQuery(res.val) ? res.val : null;
                }

                if (c.valid.isJQuery(res.val)) {
                    ret.success = (res.val.val() !== item.el.val());
                    ret.message = !ret.success ? res.message : null;
                }

                return ret.success;
            }
        };

        c.common.each(item.rules.refer, function (res, handlerKey) {
            return c.common.apply(handlers[handlerKey], res, res);
        });
        return executed ? ret : null;
    }

    /**
     * 正则表达式校验
     * @param item {*}
     * @return {{el: *, name: *, val: *, success: boolean, message: null}}
     */
    function regexpValid(item) {
        var
            executed = false,
            ret = {
                el: item.el,
                name: item.name,
                val: item.el.val(),
                success: true,
                message: null
            };

        var handlers = {
            reg: function (res) {
                if (c.valid.isString(res.val)) {
                    var regs = $.trim(res.val).replace('/^', '').split('$/');
                    c.common.each(regs, function (v, i) {
                        regs[i] = $.trim(v);
                    });
                    res.val = new RegExp('^' + regs[0] + '$', regs[1]);
                }

                if (c.valid.isRegExp(res.val)) {
                    executed = true;
                    ret.success = res.val.test(item.el.val());
                    ret.message = !ret.success ? res.message : null;
                }

                return ret.success;
            }
        };

        c.common.each(item.rules.regexp, function (res, handlerKey) {
            return c.common.apply(handlers[handlerKey], res, res);
        });

        return executed ? ret : null;
    }

    /**
     * 设置表单数据
     * @param self {Form} 表单对象
     * @param data {Object} 表单数据
     */
    function setData(self, data) {
        var conf = getConf(self);
        conf.data = data;
        parseConf(conf);
        var effectiveProps = [];
        c.common.each(conf.items, function (item) {
            var
                el = item.el,
                name = el.attr('name'),
                val = data[name],
                tagName = el[0].tagName.toLowerCase();
            effectiveProps.push(name);
            switch (tagName) {
                case 'input':
                    // input:radio, input:checkbox 特殊处理, 其他类型委托给jQuery
                    var type = el.attr('type') || 'text';
                    if (/^radio|checkbox$/i.test(type)) {
                        if (c.valid.isArray(val)) el.prop('checked', -1 !== val.indexOf(item.defaultValue));
                        else el.prop('checked', val === item.defaultValue);
                        break;
                    }
                default:
                    el.val(val);
                    break;
            }
        });

        // 删除无效属性
        jsu.arrays.unique(effectiveProps);
        var invalidKeys = jsu.objects.keys(data);
        jsu.arrays.remove(invalidKeys, effectiveProps);
        jsu.common.each(invalidKeys, function (invalidKey) {
            delete conf.data[invalidKey];
        });

    }

    /**
     * 获取并缓存表单数据
     * @param self {Form} 表单对象
     * @return {*|{}} 表单数据
     */
    function getData(self) {
        var conf = getConf(self);
        if (conf.mvvm)
            return conf.data;

        Object.assign(conf.data = {}, getDataFromHtml(self));
        Form.logger && Form.logger.info('获取表单数据: ', conf.data);
        return conf.data;
    }

    /**
     * 从HTML控件获取表单数据
     * @param self {Form} Form对象
     */
    function getDataFromHtml(self) {
        var
            conf = getConf(self),
            data = {};
        // input:       undefined/text/password/file    直接获取value
        // textarea:                                    直接获取value
        // select:      multipart?                      直接获取选中值
        // input:       radio                           通过 $.is(':checked')获取单个选中值
        // input:       checkbox                        通过 $.is(':checked')获取多个选中值
        c.common.each(conf.items, function (item) {
            var
                el = item.el,
                name = el.attr('name'),
                oldVal = data[name],
                val = el.val(),
                tagName = el[0].tagName.toLowerCase();
            switch (tagName) {
                case 'input':
                    // input:radio, input:checkbox 特殊处理, 其他类型委托给jQuery
                    var type = el.attr('type') || 'text';
                    if (/^radio$/i.test(type)) {
                        if (el.is(':checked'))
                            data[name] = item.defaultValue;
                        break;
                    } else if (/^checkbox$/i.test(type)) {
                        if (el.is(':checked'))
                            (data[name] = oldVal || []).push(item.defaultValue);
                        data[name] = c.arrays.unique(data[name] || []);
                        break;
                    } else if (/file/i.test(type)) {
                        break;
                    }
                case 'textarea':
                case 'select':
                    data[name] = val;
                    break;
            }
        });
        return data;
    }

    /**
     * 获取配置缓存
     * @param formObj {Form|*} 表单对象
     * @param [mvvm] {boolean} true-启用mvvm模式
     * @param [el] {Element|*} 表单容器
     * @return {*} 配置缓存
     */
    function getConf(formObj, mvvm, el) {
        return Form.cache[formObj.key] = (Form.cache[formObj.key] || {
            self: formObj,
            $form: $(el),
            mvvm: mvvm,
            data: {},
            items: [],      // 顺序访问
            itemsMap: {}    // 快速索引
        });
    }

    /**
     * 解析表单配置
     * @param conf {*} 配置对象
     * @param [mvvm] {boolean} true-启用mvvm模式, false-关闭mvvm模式
     */
    function parseConf(conf, mvvm) {
        mvvm = c.valid.nullOrUndefined(mvvm) ? conf.mvvm : mvvm;
        conf.items.length = 0;
        conf.$form.find('[name]').each(function () {
            var
                $this = $(this),
                name = $this.attr('name'),
                itemConf = conf.itemsMap[name] = {
                    conf: conf,
                    el: $this,
                    mvvm: mvvm,
                    name: name,
                    defaultValue: $this.attr('value'),
                    defaultChecked: $this[0].defaultChecked,
                    rules: {
                        regexp: {
                            reg: {
                                val: $this.attr('data-regexp'),
                                message: $this.attr('data-regexp-error')
                            }
                        },
                        refer: {
                            eq: {
                                val: $this.attr('data-eq'),
                                message: $this.attr('data-eq-error')
                            },
                            notEq: {
                                val: $this.attr('data-not-eq'),
                                message: $this.attr('data-not-eq-error')
                            }
                        },
                        html: {
                            min: $this.attr('min'),
                            max: $this.attr('max'),
                            minLength: $this.attr('minLength'),
                            maxLength: $this.attr('maxLength'),
                            require: undefined !== $this.attr('require')
                        },
                        remote: $this.attr('data-remote-valid')
                    }
                };
            if (mvvm)
                activeMvvm(itemConf, conf.data);
            conf.items.push(itemConf);
        });
    }

    /**
     * 激活mvvm模式
     * @param item {*} 表单项配置
     * @param data {*} 表单数据对象
     */
    function activeMvvm(item, data) {
        if (!item.mvvm) return;

        // View -> Model
        (function (el, data) {
            el.change(function eventHandler() {
                var
                    $this = $(this),
                    name = $this.attr('name'),
                    val = $this.val(),
                    type = $this.attr('type');

                // input:checkbox 特殊处理
                if (/input/i.test(this.tagName) && /checkbox/i.test(type)) {
                    var old = data[name] || [];
                    if ($this.is(':checked')) old.push(val);
                    else c.arrays.remove(old, val);
                    data[name] = c.arrays.unique(old);
                }

                // 其他控件
                else {
                    data[name] = val;
                }
            });

            // 暂不实现
            // input        --> input!(radio/checkbox)
            //                  textarea
            // blur         --> input!(radio/checkbox)
            //                  textarea
        })(item.el, data);

        // Model -> View
        (function (el, name, data) {

            // 定义数据源
            var origDescr = Object.getOwnPropertyDescriptor(data, '_orig');
            if (!(origDescr && c.valid.isObject(origDescr.value)))
                Object.defineProperty(data, '_orig', {
                    value: {}
                });
            data._orig[name] = data[name];

            // 定义属性描述符
            var descr = Object.getOwnPropertyDescriptor(data, name);
            if (descr && c.valid.isFunction(descr.get)) return;
            var descriptor = {
                enumerable: true,
                get: function () {
                    return this._orig[name];
                },
                set: function (val) {
                    this._orig[name] = val;
                    c.common.each(item.conf.items, function (item) {
                        var
                            el = item.el,
                            val = data[name],
                            tagName = el[0].tagName.toLowerCase();
                        if (el.attr('name') !== name) return;
                        switch (tagName) {
                            // input:radio, input:checkbox 特殊处理
                            case 'input':
                                var type = el.attr('type') || 'text';
                                if (/^radio|checkbox$/i.test(type)) {
                                    if (c.valid.isArray(val)) el.prop('checked', -1 !== val.indexOf(item.defaultValue));
                                    else el.prop('checked', val === item.defaultValue);
                                    break;
                                } else if (/file/i.test(type)) {
                                    Form.logger && Form.logger.warn('input:file 不允许手动设置');
                                    break;
                                }
                            // 其他类型委托给jQuery
                            default:
                                el.val(val);
                                break;
                        }
                    });

                    // 数据校验
                    Object.assign(data._orig, getDataFromHtml(item.conf.self));
                }
            };
            Object.defineProperty(data, name, descriptor);

            // TODO Array.length改变, Array.push, Array.shift...
            // TODO Object 添加新属性

        })(item.el, item.name, data);
    }

    Form.logger && Form.logger.info('载入Form API', c.Form.dir = {
        api: {
            '[[constructor]]': 'Form(el, mvvm, dev), el-表单容器(不仅仅<Form>), mvvm-是否启用数据双向绑定, dev-调试模式打印更多日志信息',
            data: 'function(data?):data?, 获取或设置表单数据',
            clear: 'function():void 完全清空表单数据',
            restore: 'function():void 初始化表单数据, 恢复到表单加载完成时的状态',
            refresh: 'function():void 刷新表单控件, 同时刷新mvvm对象(如果启用)',
            validation: 'function({success?, failed?, completed?}?):{success:boolean, errors:[{el, name, val, success, message}]} 表单校验'
        },
        eg: 'var form = new Form($formContainer); // 可以缺省 new 关键字'
    });

})(window.jsu = (window.jsu || {}));
