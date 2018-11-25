(function (c) {
    'use strict';

    c.Pager = Pager;
    Pager.logger = jsu.Logger ? jsu.Logger('Pager') : null;

    // K - Pager Key
    // V - Pager instance
    Pager.cache = {};

    // class样式列表
    Object.defineProperties(Pager.style = {}, {
        bounds: {value: 'jsu-pager-bounds'},
        total_container: {value: 'jsu-pager-total-container'},
        total_value: {value: 'jsu-pager-total-value'},
        sizes_container: {value: 'jsu-pager-sizes-container'},
        pagers_container: {value: 'jsu-pager-pagers-container'},
        pagers_trigger: {value: 'jsu-pager-page-trigger'},
        current_index: {value: 'jsu-pager-current-index'},
        previous_container: {value: 'jsu-pager-previous-container'},
        next_container: {value: 'jsu-pager-next-container'},
        jump_container: {value: 'jsu-pager-jump-container'},
        jump_trigger: {value: 'jsu-pager-jump-trigger'},
        before_more: {value: 'jsu-pager-before-more'},
        after_more: {value: 'jsu-pager-after-more'},
        disable: {value: 'jsu-pager-disable'}
    });

    // 创建相关
    Object.defineProperties(Pager.layoutCreator = {}, {
        total: {
            value: function (conf) {
                Pager.logger && Pager.logger.log('创建 $total', conf);
                var $total = $('<div>').addClass(Pager.style.total_container);
                $total.append('共').append($('<span>', {html: conf.dataSet.total}).addClass(Pager.style.total_value)).append('条');
                return $total
            }
        },
        sizes: {
            value: function (conf) {
                Pager.logger && Pager.logger.log('创建 $sizes', conf);
                var options = [];
                c.common.each(conf.sizes, function (size) {
                    options.push({text: size + '条/页', value: size});
                });
                var $select = c.$common.selectFill('', conf.dataSet.size, options);
                return $select.addClass(Pager.style.sizes_container);
            }
        },
        prev: {
            value: function (conf) {
                Pager.logger && Pager.logger.log('创建 $prev', conf);
                var $prev = $('<div>').addClass(Pager.style.previous_container);
                $('<i>').addClass('fa fa-angle-left').appendTo($prev);
                return $prev;
            }
        },
        pager: {
            value: function (conf) {
                var $c = $('<ul>').addClass(Pager.style.pagers_container);

                // 1 | ...
                if (conf.dataSet.numStart !== conf.dataSet.numFirst)
                    $('<li>', {html: 1}).addClass(Pager.style.pagers_trigger).appendTo($c);
                if (conf.dataSet.numStart > conf.dataSet.numFirst + 1)
                    $('<li>', {html: '...'}).addClass(Pager.style.before_more).appendTo($c);

                // n | ... | n
                c.common.forNext(conf.dataSet.numStart, 1, conf.dataSet.numEnd + 1, function (num) {
                    $('<li>', {html: num})
                        .addClass(Pager.style.pagers_trigger)
                        .addClass(num === conf.dataSet.index ? Pager.style.current_index : '')
                        .appendTo($c);
                });
                if (!$c.find('.' + Pager.style.current_index).length) {
                    Pager.logger && Pager.logger.log('指定页码[' + conf.dataSet.index + ']不存在, 默认使用最后页码值[' + conf.dataSet.numEnd + ']');
                    $c.find('.' + Pager.style.pagers_trigger + ':last').addClass(Pager.style.current_index);
                    conf.dataSet.index = conf.dataSet.numEnd;
                }

                // ... | numLast
                if (conf.dataSet.numEnd < conf.dataSet.numLast - 1)
                    $('<li>', {html: '...'}).addClass(Pager.style.after_more).appendTo($c);
                if (conf.dataSet.numEnd !== conf.dataSet.numLast)
                    $('<li>', {html: conf.dataSet.numLast}).addClass(Pager.style.pagers_trigger).appendTo($c);

                return $c;
            }
        },
        next: {
            value: function (conf) {
                Pager.logger && Pager.logger.log('创建 $next', conf);
                var $next = $('<div>').addClass(Pager.style.next_container);
                $('<i>').addClass('fa fa-angle-right').appendTo($next);
                return $next;
            }
        },
        jumper: {
            value: function (conf) {
                Pager.logger && Pager.logger.log('创建 $jump', conf);
                var $jump = $('<div>').addClass(Pager.style.jump_container);
                $jump.append('前往')
                    .append($('<input>').addClass(Pager.style.jump_trigger))
                    .append('页');
                return $jump;
            }
        }
    });

    /**
     * 分页插件
     * @constructor
     * @param $origin {jQuery|Element} 容器
     * @param autoInit {Boolean} true-自动初始化
     * @param dev {Boolean} true-调试模式, 打印更多日志
     * @return {Pager}
     */
    function Pager($origin, autoInit, dev) {
        if (!(this instanceof Pager))
            return new Pager($origin, autoInit, dev);
        autoInit = autoInit || false;
        dev = dev || false;

        // 生成缓存Key
        Object.defineProperty(this, 'key', {
            value: 'uk' + (Math.random() + '').substring(2)
        });

        // 初始化配置
        var conf = getConf(this, $origin, false);

        // 调试模式
        if (dev) {
            Object.defineProperty(this, '[[conf]]', {
                value: conf
            });
        } else {
            Pager.logger = null;
        }

        // 自动初始化
        if (autoInit)
            this.init();

        Pager.logger && Pager.logger.info('初始化Form对象完成', this);
    }

    /**
     * 初始化
     */
    Pager.prototype.init = function () {
        var conf = getConf(this, null, false);
        if (conf.loaded) {
            Pager.logger && Pager.logger.info('跳过重复初始化');
            return;
        }
        conf.loaded = true;
        conf.destroyed = false;
        Pager.logger && Pager.logger.info('开始初始化 >>> ', conf);

        // 解析配置
        var
            dataSet = conf.$origin[0].dataset,
            tempConf = {
                class: conf.$origin.attr('class'),
                style: conf.$origin.attr('style'),
                url: dataSet.url,
                reload: 'true' === dataSet.reload,
                sizes: c.arrays.trims((dataSet.sizes || '10,20,50,100').split(','), function (el) {
                    return parseInt(el);
                }),
                count: dataSet.count,
                layout: c.arrays.trims((dataSet.layout || '').split(','))
            };
        Pager.logger && Pager.logger.log('配置解析结果', tempConf);

        // 覆盖默认配置
        c.objects.copyProps(tempConf, conf);
        conf.dataSet.size = conf.sizes[0];
        Pager.logger && Pager.logger.log('保存配置后', conf);

        // 创建替换模板
        replaceWithTemplate(conf);

        // 激活事件
        activateEvents(conf);

        // 初始化
        this.index(1);

        c.common.apply(conf.events.loaded, this);
        Pager.logger && Pager.logger.info('初始化完成 <<< ', conf);
    };

    /**
     * 卸载Table插件
     */
    Pager.prototype.destroy = function () {
        var conf = getConf(this);
        conf.templates.$bounds.replaceWith(conf.$origin);
        conf.loaded = false;
        conf.destroyed = true;
        c.common.apply(conf.events.destroyed, this);
    };

    /**
     * 获取/设置数据
     * @param data {{total:Number, index:Number, other?:*}} 分页数据
     * @return {*} 获取分页数据
     */
    Pager.prototype.data = function (data) {
        Pager.logger && Pager.logger.log('开始更新 >>> ', data);
        var conf = getConf(this);

        if (c.valid.nullOrUndefined(data))
            return c.objects.clone(conf.dataSet);

        // 刷新数据
        conf.self.originData = conf.dataSet.origin = data;
        conf.dataSet.index = c.valid.nullOrUndefined(data.index) ? conf.dataSet.index : data.index;
        conf.dataSet.total = c.valid.nullOrUndefined(data.total) ? conf.dataSet.total : data.total;

        // 总条数
        var $total = Pager.layoutCreator.total(conf);
        conf.templates.$total.replaceWith($total);
        conf.templates.$total = $total;

        renderPages(conf);
        c.common.apply(conf.events.after, this, data, c.objects.clone(conf.dataSet));
    };

    /**
     * 设置/获取当前页码
     * @param index {number} 设置当前页码, 为null时获取
     * @return {number} 获取当前页码
     */
    Pager.prototype.index = function (index) {
        var conf = getConf(this);
        if (c.valid.nullOrUndefined(index)) {
            Pager.logger && Pager.logger.log('获取当前页码 ', conf.dataSet.index);
            return conf.dataSet.index;
        }

        if (false === c.common.apply(conf.events.before, this, index, c.objects.clone(conf.dataSet))) {
            Pager.logger && Pager.logger.log('已阻止跳转到指定页码[' + index + ']');
            return conf.dataSet.index;
        }

        Pager.logger && Pager.logger.log('设置当前页码 ', index);
        if (index !== parseInt(index))
            throw '参数index[' + index + ']不是有效数值';
        if (conf.dataSet.numFirst > index || index > conf.dataSet.numLast)
            throw '参数index[' + index + ']超出边界值([' + conf.dataSet.numFirst + ',' + conf.dataSet.numLast + '])';

        conf.dataSet.index = index;
        request(conf);

        c.common.apply(conf.events.after, this, index, c.objects.clone(conf.dataSet));
        return conf.dataSet.index;
    };

    /**
     * 注册事件
     * @param events {*} 事件对象
     */
    Pager.prototype.events = function (events) {
        var conf = getConf(this);
        c.common.each(conf.events, function (fn, eK) {
            conf.events[eK] = c.valid.isFunction(events[eK]) ? events[eK] : fn;
        });
        Pager.logger && Pager.logger.log('注册事件完成', conf);
        return conf.events;
    };

    /**
     * 如果已配置url发送网络请求, 否则直接渲染视图
     * @param conf {*} 配置对象
     */
    function request(conf) {
        if (!conf.url) {
            Pager.logger && Pager.logger.log('手动调用 Pager.data 设置数据');
            renderPages(conf);
            return;
        }

        // 发送网络请求
        c.$ajax.jsonAjax({
            url: conf.url,
            data: {size: conf.dataSet.size, index: conf.dataSet.index},
            success: function (res) {
                var data = c.common.apply(conf.events.formatter, conf.self, res);
                conf.self.data(c.valid.nullOrUndefined(data) ? res : data);
            }
        });

    }

    /**
     * 激活事件
     * @param conf {*} 配置对象
     */
    function activateEvents(conf) {
        // 点击页码
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.pagers_trigger, 'click', function (e) {
            c.$common.stopPropagation(e);
            var
                $this = $(this),
                pageNum = parseInt($this.text());
            Pager.logger && Pager.logger.log('跳转到页码 [' + pageNum + ']', conf);
            conf.self.index(pageNum);
        });

        // 切换页大小
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.sizes_container, 'change', function (e) {
            c.$common.stopPropagation(e);
            Pager.logger && Pager.logger.log('修改页大小 [' + conf.dataSet.size + ' >> ' + this.value + ']', conf);
            conf.dataSet.size = +this.value;
            // renderPages(conf);
            request(conf);
        });

        // 上一页
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.previous_container, 'click', function (e) {
            c.$common.stopPropagation(e);
            conf.self.index(conf.dataSet.index - 1);
        });

        // 下一页
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.next_container, 'click', function (e) {
            c.$common.stopPropagation(e);
            conf.self.index(conf.dataSet.index + 1);
        });

        // 跳转指定页
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.jump_trigger, 'blur', function () {
            var value = parseInt(this.value);
            this.value = isNaN(value) ? '' : value;
        });
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Pager.style.jump_trigger, 'change', function (e) {
            c.$common.stopPropagation(e);
            var index = parseInt(this.value);
            if (conf.dataSet.numFirst <= index && index <= conf.dataSet.numLast)
                conf.self.index(index);
            else
                Pager.logger && Pager.logger.log('跳转值[' + index + ']超出页码范围[' + conf.dataSet.numStart + ',' + conf.dataSet.numEnd + ']');
        });
    }

    /**
     * 渲染页码
     * @param conf {*} 配置对象
     */
    function renderPages(conf) {
        calcStartAndEnd(conf);
        var $pagers = Pager.layoutCreator.pager(conf);
        conf.templates.$pager.replaceWith($pagers);
        conf.templates.$pager = $pagers;

        // 禁用上一页
        var $prev = conf.templates.$bounds.find('.' + Pager.style.previous_container);
        if (conf.dataSet.numFirst === conf.dataSet.index)
            $prev.addClass(Pager.style.disable);
        else
            $prev.removeClass(Pager.style.disable);


        // 禁用下一页
        var $next = conf.templates.$bounds.find('.' + Pager.style.next_container);
        if (conf.dataSet.numLast === conf.dataSet.index)
            $next.addClass(Pager.style.disable);
        else
            $next.removeClass(Pager.style.disable);
    }

    /**
     * 计算开始/结束页码
     * @param conf {*} 配置对象
     */
    function calcStartAndEnd(conf) {
        conf.dataSet.total = conf.dataSet.origin.total || conf.dataSet.total;

        // 第一个页码
        // 最后一个页码
        conf.dataSet.numFirst = 1;
        conf.dataSet.numLast = parseInt((conf.dataSet.total + conf.dataSet.size - 1) / conf.dataSet.size) || 1;

        // 按当前页码和可显示页码数量计算开始/结束页码
        // numStart/numEnd
        var
            count = conf.count,
            offset = parseInt(count / 2),
            numStart = conf.dataSet.index - offset,
            numEnd = conf.dataSet.index + offset;
        if (conf.dataSet.numFirst > numStart) {
            numEnd += 1 - numStart;
            numStart = 1;
        }
        if (numEnd > conf.dataSet.numLast) {
            numStart -= numEnd - conf.dataSet.numLast;
            numEnd = conf.dataSet.numLast;
            if (conf.dataSet.numFirst > numStart)
                numStart = 1;
        }
        conf.dataSet.numStart = numStart;
        conf.dataSet.numEnd = numEnd < numStart ? numStart : numEnd;

    }

    /**
     * 创建模板并替换
     * @param conf {*} 配置
     */
    function replaceWithTemplate(conf) {
        conf.templates.$bounds = $('<div>').addClass(Pager.style.bounds);
        conf.templates.$bounds.addClass(conf.class).attr('style', conf.style);

        c.common.each(conf.layout, function (key) {
            Pager.logger && Pager.logger.log('加载布局', key);
            var $layout = c.common.apply(Pager.layoutCreator[key], conf, conf);
            if ($layout && $layout.length) {
                conf.templates['$' + key] = $layout;
                conf.templates.$bounds.append($layout);
            }
        });
        renderPages(conf);

        conf.$origin.replaceWith(conf.templates.$bounds);
    }

    /**
     * 获取配置
     * @param self {Pager} 表格对象
     * @param [$c] {jQuery|Element} 表格容器对象
     * @param [checkAlive=true] {Boolean} true-destroy校验
     * @return {*}
     */
    function getConf(self, $c, checkAlive) {
        var conf = Pager.cache[self.key] = (Pager.cache[self.key] || {
            _key: self.key,
            self: self,
            $origin: c.valid.isJQuery($c) ? $c : $($c),
            templates: {
                $bounds: null,  // 主容器,
                $total: null,   // 总条数
                $sizes: null,   // 可选页大小
                $pager: null,   // 页码
                $jumper: null   // 跳转
            },
            dataSet: {
                origin: {},     // 原始数据
                total: 0,       // 总数量
                size: 1,        // 页大小
                index: 1,       // 当前页码值
                numFirst: 1,    // 第一个页码值
                numStart: 1,    // 开始页码值
                numEnd: 1,      // 结束页码值
                numLast: 1      // 最后个页码值
            },
            events: {
                loaded: null,       // 加载完成
                destroyed: null,    // 卸载完成
                before: null,       // 跳转到指定页之前
                formatter: null,    // 数据格式化
                after: null         // 跳转到指定页之后
            },
            class: '',
            style: '',
            url: '',
            reload: false,
            sizes: [10, 20, 50, 100],
            count: 7,

            loaded: false,
            destroyed: false
        });
        if ((checkAlive || c.valid.nullOrUndefined(checkAlive)) && conf.destroyed)
            throw '已卸载插件, 无法继续使用';
        return conf;
    }

    Pager.logger && Pager.logger.info('载入Logger API', Pager.dir = {
        api: Pager.prototype,
        '[[constructor]]': 'Pager($origin, autoInit, dev), $origin-表格(容器使用内部使用table:first), autoInit-自动初始化, dev-调试模式打印更多日志',
        eg: '<div class="pager"\n' +
        '     style="color:#F00"\n' +
        '     data-url=\'user/getAll\'\n' +
        '     data-reload=\'true\'\n' +
        '     data-sizes=\'5,10,20,50,100\'\n' +
        '     data-count=\'7\'\n' +
        '     data-layout="total, sizes, prev, pager, next, jumper"></div>'
    });
})(window.jsu = (window.jsu || {}));