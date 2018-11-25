/*
 * 日志输出
 */
(function (c) {
    'use strict';
    c.Logger = Logger;
    Logger.logger = new Logger('Logger');

    var console = window.console || {
        log: null,
        info: null,
        warn: null,
        error: null
    };

    function Logger(tag) {
        if (!(this instanceof Logger))
            return new Logger(tag);
        this.tag = tag;
    }

    apis(Logger.prototype);
    apis(Logger);

    function apis(obj) {
        Object.defineProperties(obj, {
            log: {
                get: function () {
                    return createPrinter.call(this, '  LOG');
                }
            },
            info: {
                get: function () {
                    return createPrinter.call(this, ' INFO');
                }
            },
            warn: {
                get: function () {
                    return createPrinter.call(this, ' WARN');
                }
            },
            error: {
                get: function () {
                    return createPrinter.call(this, 'ERROR');
                }
            }
        });
    }

    /**
     * 创建打印机
     * @param lv 日志级别
     * @return {Function} 日志打印机
     */
    function createPrinter(lv) {
        var
            tag = ('[' + (this.tag || 'Anonymous') + ']'),
            _lv = '[' + lv + ']:';
        return function (msg) {

            var fnName = '', positionLink = '';
            try {
                var
                    e = new Error(),
                    sp = e.stack.split('\n'),
                    sp2 = c.strings.trim(sp[2]);
                fnName = sp2.match(/ (.+) \(/);
                fnName = fnName ? fnName[1] : null;
                positionLink = sp2.match(/\((.+)\)/);
                positionLink = positionLink ? positionLink[1] : null;
            } catch (ignore) {
            }

            var
                date = c.dates.formatNow('[MM-dd hh:mm:ss]'),
                m = console[lv.trim().toLowerCase()];
            if (m instanceof Function) {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(date, _lv, tag);
                m.apply(null, args);
                c.common.apply(console.log, console, '[' + fnName + ']:' + positionLink + '\n\n');
            }
        };
    }

    Logger.logger && Logger.logger.info('载入Logger API', c.Logger.dir = {
        api: {
            '[[constructor]]': 'Logger(tag), tag-日志标记(建议使用文件名)',
            log: "LOG 级别日志",
            info: "INFO 级别日志",
            warn: "WARN 级别日志",
            error: "ERROR 级别日志"
        },
        eg: '两种使用方式: 1. jsu.Logger.log()匿名调用; 2. new jsuLogger(tag).log()指定标签'
    });

})(window.jsu = (window.jsu || {}));