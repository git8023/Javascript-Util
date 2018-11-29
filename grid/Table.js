/**
 * 表格类
 * 依赖: Logger, valid, common
 * 1. 行数据刷新;
 * 2. 可编辑单元格使用自定义模板([data-editable]);
 * 3. action被改变事件(激活不同的行数据) -> 由selection点击事件实现
 * 4. 列顺序调整
 * 5. 选中/取消选中所有数据行
 * 6. 表格嵌套时, 事件只委托到当前插件对象
 */
;(function (c) {
    'use strict';
    c.Table = Table;
    Table.logger = c.Logger ? c.Logger('Table') : null;

    // K - Table Key
    // V - Table instance
    Table.cache = {};

    // 创建相关
    Object.defineProperties(Table.creator = {}, {
        table: {
            get: function () {
                return $('<table>').addClass(Table.style.table);
            }
        },
        tbody: {
            get: function () {
                return $('<tbody>');
            }
        },
        tr: {
            get: function () {
                return $('<tr>').addClass(Table.style.table_row);
            }
        },
        td: {
            get: function () {
                return $('<td>').addClass(Table.style.table_cell);
            }
        },
        radio: {
            get: function () {
                return $('<input>', {type: 'radio', name: 'table_selection_'})
                    .addClass(Table.style.selection)
                    .addClass(Table.style.selection_radio);
            }
        },
        checkbox: {
            get: function () {
                return $('<input>', {type: 'checkbox', name: 'table_selection_'})
                    .addClass(Table.style.selection)
                    .addClass(Table.style.selection_checkbox);
            }
        },
        expander: {
            get: function () {
                return $('<i>').addClass('fa fa-angle-right').addClass(Table.style.expander);
            }
        },
        columnModifier: {
            get: function () {
                return $('<div>').addClass(Table.style.column_modifier);
            }
        },
        expandContainer: {
            value: function (headerCount) {
                var $row = $('<tr>').addClass(Table.style.expand_container_row),
                    $cell = this.td.attr({colspan: headerCount || 1}).appendTo($row);
                $('<div>').addClass(Table.style.expand_container).appendTo($cell);
                return $row;
            }
        }
    });

    // 可编辑相关
    Object.defineProperties(Table.writableCreator = {}, {
        text: {
            value: function (param) {
                return $('<input>', {
                    name: param.headConf.prop,
                    type: 'text',
                    'data-date-format': param.headConf.dateFormat
                }).addClass(Table.style.writable).val(param.value);
            }
        },
        date: {
            value: function (param) {
                if (param.headConf.dateFormat)
                    param.value = c.dates.format(param.value, param.headConf.dateFormat);
                return Table.writableCreator.text(param);
            }
        },
        enum: {
            value: function (param) {
                return c.$common.selectFill(param.headConf.prop, param.value, param.options);
            }
        },
        html: {
            value: function (param) {
                return $('<textarea>', {name: param.headConf.prop}).val(param.value);
            }
        },
        editableContainer: {
            value: function () {
                return $('<span>').addClass(Table.style.editable_container);
            }
        }
    });

    // class样式列表
    Object.defineProperties(Table.style = {}, {
        bounds: {value: 'jsu-bounds'},
        table: {value: 'jsu-table'},
        table_header: {value: 'jsu-table-header'},
        table_header_row: {value: 'jsu-table-header-row'},
        table_header_cell: {value: 'jsu-table-header-cell'},
        table_body: {value: 'jsu-table-body'},
        table_row: {value: 'jsu-table-row'},
        table_cell: {value: 'jsu-table-cell'},
        table_empty_row: {value: 'jsu-table-empty-row'},
        empty_td: {value: 'jsu-empty-td'},
        selection: {value: 'jsu-selection'},
        selection_radio: {value: 'jsu-selection-radio'},
        selection_checkbox: {value: 'jsu-selection-checkbox'},
        expander: {value: 'jsu-expander'},
        expander_opened: {value: 'jsu-expander-opened'},
        expand_container_row: {value: 'jsu-expand-container-row'},
        expand_container: {value: 'jsu-expand-container'},
        editable_container: {value: 'jsu-writable-container'},
        writable: {value: 'jsu-writable'},
        column_modifier: {value: 'jsu-column-modifier'},
        column_width_editing: {value: 'jsu-column-width-editing'},
        trigger_action: {value: 'jsu-trigger-action'},
        swapper_action: {value: 'jsu-swapper-action'},
        fixed_header_container: {value: 'jsu-fixed-header-container'},

        pager_container: {value: 'jsu-table-pager-container'}
    });

    // 自定义HTML属性名
    Object.defineProperties(Table.defineHtmlKey = {}, {
        bounds_key: {value: 'data-jsu-bounds-uk'},
        row_data_key: {value: 'data-jsu-uk'},
        editable_previous_value: {value: 'data-jsu-previous'},
        editable_template: {value: 'data-writable'},
        column_activator_from_x: {value: 'data-from-x'},
        column_activator_to_x: {value: 'data-to-x'}
    });

    /**
     * @constructor
     * @param $container {jQuery|Element} 表格容器, 实例化后使用 Form.template 替换. 如果当前控件是Table直接替换,
     *                                      否则从 $container 中查找第一个 Table 控件. 如果找不到抛出异常
     * @param [autoInit=false] {Boolean} true-自动初始化
     * @param [dev=false] {Boolean} true-开启调试模式(打印更多日志)
     * @return {Table}
     * @see Table.init()
     */
    function Table($container, autoInit, dev) {
        if (!(this instanceof Table))
            return new Table($container, autoInit, dev);
        autoInit = autoInit || false;
        dev = dev || false;

        // 生成缓存Key
        Object.defineProperty(this, 'key', {
            value: 'uk' + (Math.random() + '').substring(2)
        });

        // 初始化配置
        var conf = getConf(this, $container, false);

        // 调试模式
        if (dev) {
            Object.defineProperty(this, '[[conf]]', {
                value: conf
            });
            conf.dev = dev;
        } else {
            Table.logger = null;
        }

        // 自动初始化
        if (autoInit)
            this.init();

        Table.logger && Table.logger.info('初始化Form对象完成', this);
    }

    /**
     * 初始化, 使用模板控件替换表格容器控件($container)
     * @return {Table}
     */
    Table.prototype.init = function () {
        var conf = getConf(this, null, false);
        if (conf.loaded) {
            Table.logger && Table.logger.info('跳过重复初始化');
            return this;
        }
        Table.logger && Table.logger.info('开始初始化 >>> ', conf);
        conf.loaded = true;
        conf.destroyed = false;
        conf.expandIndexedCache = {};
        conf.uniqueIndexedData = {};
        conf.selectionDataUniqueIndex.length = 0;

        // 表格容器校验
        var $table = conf.$container;
        if (!/^table$/i.test($table[0].tagName))
            $table = conf.$container.find('table:eq(0)');
        if (!$table.length) throw "未找到有效表格容器";
        parseTableConfig($table, conf);

        // 解析表头
        var
            hasSelectionColumn = false, // selection只允许配置一列
            hasExpandColumn = false,    // expand 只允许存在一列
            err, html, errAttrIndex;
        conf.headers = [];
        $table.find('tr:eq(0)>th').each(function () {
            var $th = $(this);
            var headConf = parseHeaderConfig($th);

            switch (headConf.type) {
                case 'selection':
                    if (hasSelectionColumn) {
                        err = '无效的表头配置, 选择列只允许配置一种selection类型且只能存在一列';
                        html = $th[0].outerHTML.split('\n')[0];
                        err += '\n' + html;
                        errAttrIndex = html.indexOf('data-type');
                        err += '\n' + c.strings.repeat(' ', errAttrIndex) + '^^^^';
                        throw err;
                    } else {
                        conf.headers.push(headConf);
                        hasSelectionColumn = true;
                    }
                    break;
                case 'expand':
                    if (hasExpandColumn) {
                        err = '无效的表头配置, 选择列只允许配置一列expand';
                        html = $th[0].outerHTML.split('\n')[0];
                        err += '\n' + html;
                        errAttrIndex = html.indexOf('data-type');
                        err += '\n' + c.strings.repeat(' ', errAttrIndex) + '^^^^';
                        throw err;
                    } else {
                        conf.headers.push(headConf);
                        hasExpandColumn = true;
                    }
                    break;
                default:
                    conf.headers.push(headConf);
            }
        });

        // 获取表格模板
        replaceWithTemplate(conf);

        // 初始化表格数据
        var data = this.data();
        this.data((data && data.length) ? data : []);

        // 激活委托事件
        activeRegisterEvents(conf);

        // 启用分页条 pagination
        if (conf.pagination._enable)
            activatePagination(conf);

        Table.logger && Table.logger.info('初始化完成 <<< ', conf);
        return this;
    };

    /**
     * 设置/获取表格数据
     * @param [append=false] {Boolean} true-追加, false|undefined|null-覆盖
     * @param [data} {*} 设置表格数据
     * @return {*} 获取表格数据
     */
    Table.prototype.data = function (data, append) {
        var conf = getConf(this, null, true);
        if (!conf.loaded)
            this.init();
        if (c.valid.nullOrUndefined(data))
            return conf.data;

        if (data && !c.valid.isArray(data))
            throw '表格数据必须是 Array 类型';

        if (append) {
            [].push.apply(conf.data, data);
        } else {
            conf.data = data;
        }

        fillRows(conf.templates.$main, conf);
        c.common.timer(function () {
            activeColumnWidthModifier(conf);
        });
        c.common.timer(function () {
            conf.templates.$bounds.find('.' > Table.style.column_modifier + ':first').click();
        }, 200);
        c.common.apply(conf.events.updated, conf.templates.$bounds, data, this);
    };

    /**
     * 获取行数据
     * @param cell {jQuery|Element} 行内控件
     * @return {Object|null|*} 行数据
     */
    Table.prototype.rowData = function (cell) {
        if (!c.valid.isJQuery(cell))
            cell = $(cell);
        var
            $row = cell.parents('.' + Table.style.table_row),
            dataKey = $row.attr(Table.defineHtmlKey.row_data_key),
            conf = getConf(this, null, true);
        return conf.uniqueIndexedData[dataKey];
    };

    /**
     * 刷新一行数据所有列
     * @param row {*} 行数据
     * @param uniqueKeyName {String} 行数据唯一索引属性名
     * @param [invokeByValue=row.uniqueKeyName] {*} 行数据索引属性值
     */
    Table.prototype.updateRow = function (row, uniqueKeyName, invokeByValue) {
        if (!c.valid.isString(uniqueKeyName))
            throw '参数rowKey不允许为空';
        var
            conf = getConf(this),
            map = c.arrays.asMap(conf.data, uniqueKeyName, false),
            existData = map[invokeByValue];

        // 不存在指定数据, 更新失败
        if (!existData)
            return false;

        // 查找行索引
        var rowUK = '';
        c.common.each(conf.uniqueIndexedData, function (data, key) {
            if (existData === data) {
                rowUK = key;
                return false;
            }
        });

        // 使用新视图替换
        var rowIndex = conf.data.indexOf(existData);
        conf.templates.$bounds.find('.' + Table.style.table_row + '[' + Table.defineHtmlKey.row_data_key + '="' + rowUK + '"]').each(function () {
            var
                $row = $(this),
                $replace = createRow(row, conf, rowIndex);
            $row.replaceWith($replace);

            // 修复行索引
            var expiredRowUK = $replace.attr(Table.defineHtmlKey.row_data_key);
            $replace.attr(Table.defineHtmlKey.row_data_key, rowUK);
            delete conf.uniqueIndexedData[expiredRowUK];
        });

        // 更新缓存数据
        conf.data.splice(rowIndex, 1, row);
        conf.uniqueIndexedData[rowUK] = row;
    };

    /**
     * 卸载Table插件
     */
    Table.prototype.destroy = function () {
        var conf = getConf(this, null, true);
        conf.templates.$bounds.replaceWith(conf.$table);
        conf.loaded = false;
        conf.destroyed = true;
    };

    /**
     * 设置/获取监听事件
     * @param events {*} 设置监听事件
     * @return {*} 已存在监听事件
     */
    Table.prototype.events = function (events) {
        var conf = getConf(this);
        if (c.valid.isObject(events))
            c.common.each(conf.events, function (v, ek) {
                var fn = events[ek];
                conf.events[ek] = c.valid.isFunction(fn) ? fn : null;
            });
        return conf.events;
    };

    /**
     * 设置/获取pagination委托事件, 需要配置[data-pagination]属性;
     * 必须在Table初始化完成前执行
     * @param events {*} 设置监听事件
     * @return {*} 已存在监听事件
     */
    Table.prototype.paginationEvents = function (events) {
        var conf = getConf(this);
        if (c.valid.isObject(events)) {
            conf.pagination.events = events;
            conf.pagination.pager.events(events);
        }
        return conf.pagination.events;
    };

    /**
     * 设置/获取选中的行
     * @param actions {Object|Array} 设置需要选中数据(Object-单行数据, Array-多行数据), selection=radio只获取第一个元素, selection=checkbox应用所有数据
     * @return {Array} 成功选中的行
     */
    Table.prototype.actionRows = function (actions) {
        var conf = getConf(this, null, true);

        // 找到表头配置: type=selection
        var map = c.arrays.asMap(conf.headers, 'type');
        if (!map.selection) {
            Table.logger && Table.logger.log('当前表格数据行不可被选中');
            return [];
        }

        if (c.valid.nullOrUndefined(actions))
            return c.objects.values(conf.uniqueIndexedData, conf.selectionDataUniqueIndex);

        if (!c.valid.isArray(actions))
            actions = [actions];

        // 获取被选中数据行索引
        var rowKeys = [];
        c.common.each(conf.uniqueIndexedData, function (row, rowKey) {
            if (-1 !== actions.indexOf(row))
                rowKeys.push(rowKey);
        });

        // 单选按钮只保留第一条索引
        var selectionHeadConf = map.selection;
        if ('radio' === selectionHeadConf.selection)
            rowKeys = [rowKeys[0]];

        // 选中指定行
        conf.selectionDataUniqueIndex.length = 0;
        c.arrays.push(conf.selectionDataUniqueIndex, rowKeys);
        conf.templates.$bounds.find('.' + Table.style.selection)
            .prop('checked', false)
            .each(function () {
                var
                    $this = $(this),
                    $row = $this.parents('.' + Table.style.table_row),
                    rowKey = $row.attr(Table.defineHtmlKey.row_data_key);
                if (-1 !== conf.selectionDataUniqueIndex.indexOf(rowKey))
                    $this.prop('checked', true);
            });

        // 获取已选中数据
        return c.objects.values(conf.uniqueIndexedData, conf.selectionDataUniqueIndex);
    };

    /**
     * 清理选中行
     * @return {*} 清理前选中的数据
     */
    Table.prototype.clearActions = function () {
        var
            conf = getConf(this),
            rows = c.objects.values(conf.uniqueIndexedData, conf.selectionDataUniqueIndex),
            ret = c.objects.clone(rows);
        conf.templates.$bounds.find('.' + Table.style.selection).prop('checked', false);
        conf.selectionDataUniqueIndex.length = 0;
        return ret;
    };

    /**
     * 激活分页插件
     * @param conf {*} 配置对象
     */
    function activatePagination(conf) {
        var
            $c = conf.pagination.$container = $('<div>').addClass(Table.style.pager_container),
            $pager = conf.pagination.$pager = $('<div>').appendTo($c);

        c.common.each(conf.pagination, function (v, k) {
            if (!/^[_\$]/.test(k))
                $pager.attr('data-' + k, v);
        });
        $c.appendTo(conf.templates.$bounds.parent());
        conf.pagination.pager = new c.Pager($pager, true, conf.dev);
        var
            events = conf.pagination.events || {},
            after = events.after;
        events.after = function (data) {
            Table.logger && Table.logger.log('从Pagination获取到数据', arguments);
            conf.self.data(data.data);
            if (c.valid.isFunction(after))
                return after.apply(this, arguments);
        };
        conf.self.paginationEvents(events);
    }

    /**
     * 激活事件
     * @param conf {*} 表格插件配置
     */
    function activeRegisterEvents(conf) {
        var style = Table.style;

        // 列顺序调整
        (function () {
            var headerSelector = '.' + style.table_header + '>.' + style.table_header_row + '>.' + style.table_header_cell;
            c.$common.uniqueDelegate(conf.templates.$bounds, headerSelector, 'mousedown', function (e) {
                c.$common.stopPropagation(e);
                var $this = conf.swapper.$start = $(this);
                $this.addClass(Table.style.swapper_action);
                var index = $this.index();
                Table.logger && Table.logger.log('列顺序调整结束准备就绪, 开始列索引[' + index + ']', conf.headers[index], $this);
            });
            c.$common.uniqueDelegate(conf.templates.$bounds, headerSelector, 'mouseenter', function (e) {
                c.$common.stopPropagation(e);
                if (!conf.swapper.$start)
                    return;

                var
                    $this = $(this),
                    targetIndex = $this.index(),
                    startIndex = conf.swapper.$start.index(),
                    moveToAfter = (targetIndex > startIndex);
                conf.swapper.$target = $this;

                if (startIndex === targetIndex) {
                    // $.after/$.before 执行后,
                    // 鼠标在交换后的单元格移动触发的无用事件
                    return;
                }

                Table.logger && Table.logger.log('列顺序调整, [' + startIndex + '] ' + (moveToAfter ? '->' : '<-') + ' [' + targetIndex + ']');
                var fnKey = moveToAfter ? 'after' : 'before';

                $this[fnKey](conf.swapper.$start);
                conf.templates.$main.find('>.' + Table.style.table_body + '>.' + Table.style.table_row).each(function () {
                    var
                        $row = $(this),
                        $startCol = $row.find('>.' + Table.style.table_cell).eq(startIndex),
                        $targetCol = $row.find('>.' + Table.style.table_cell).eq(targetIndex);
                    $targetCol[fnKey]($startCol);
                });

                activeColumnWidthModifier(conf);
            });
            var
                boundsSelector = '[' + Table.defineHtmlKey.bounds_key + '="' + conf._key + '"]',
                boundsParent = conf.templates.$bounds.parent();
            c.$common.uniqueDelegate(boundsParent, boundsSelector, 'mouseup', swapOver);
            c.$common.uniqueDelegate(boundsParent, boundsSelector, 'mouseleave', swapOver);

            /**
             * 交换结束, 初始化交换相关缓存
             */
            function swapOver() {
                if (conf.swapper.$start) {
                    conf.swapper.$start.removeClass(Table.style.swapper_action);
                    conf.swapper.$start = null;
                    conf.swapper.$target = null;
                }
            }
        })();

        // 列宽调整
        (function () {
            /*
             * 1. 遍历表头, 并在每列末尾的left偏移量上添加 $mover -> $bounds
             * 2. 在$mover鼠标事件(mouse down)中记录当前$mover的left开始量
             * 3. 在 $bounds 鼠标事件 (mouse move) 中记录left结果值
             * 4. 在 $bounds 鼠标事件 (mouse up/leave) 中调整列宽并重新生成 $mover
             */
            c.$common.uniqueDelegate(conf.templates.$bounds, '>.' + Table.style.column_modifier, 'mousedown', function (e) {
                if (conf.templates.$top)
                    conf.templates.$top.hide();
                var
                    $this = conf.widthModifier.$trigger = $(this);
                $this.attr(Table.defineHtmlKey.column_activator_from_x, e.clientX);
                conf.templates.$bounds.addClass(Table.style.column_width_editing);
                $this.addClass(Table.style.trigger_action);
                Table.logger && Table.logger.log('激活列宽调整', $this);
            });
            conf.templates.$bounds.mousemove(function (e) {
                var
                    $trigger = conf.widthModifier.$trigger,
                    box = c.$common.box($trigger);
                if ($trigger)
                    $trigger.attr(Table.defineHtmlKey.column_activator_to_x, e.clientX - box.width * 1.5)
                        .css({left: e.clientX, height: '100%'});
            });
            conf.templates.$bounds.mouseup(function () {
                calcColumnWidthByModifierTrigger(conf);
                if (conf.templates.$top)
                    conf.templates.$top.show();
            }).mouseleave(function () {
                calcColumnWidthByModifierTrigger(conf);
            });
        })();

        // 鼠标进入数据行
        // 鼠标离开数据行
        // 点击数据行
        var rowClassSelector = '.' + style.table_body + '> .' + style.table_row;
        (function () {
            c.$common.uniqueDelegate(conf.templates.$bounds, rowClassSelector, 'mouseenter', function (e) {
                var
                    $row = $(this),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];
                if (!$row.hasClass(Table.style.table_empty_row)) {
                    Table.logger && Table.logger.info('鼠标进入表格行');
                    c.common.apply(conf.events.mouseEnter, $row, row, e, $row);
                }
            });
            c.$common.uniqueDelegate(conf.templates.$bounds, rowClassSelector, 'mouseleave', function (e) {
                var
                    $row = $(this),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];
                if (!$row.hasClass(Table.style.table_empty_row)) {
                    Table.logger && Table.logger.info('鼠标离开表格行');
                    c.common.apply(conf.events.mouseLeave, $row, row, e, $row);
                }
            });
            c.$common.uniqueDelegate(conf.templates.$bounds, rowClassSelector, 'click', function (e) {
                c.$common.stopPropagation(e);
                var
                    $row = $(this),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];
                if (!$row.hasClass(Table.style.table_empty_row))
                    return;

                var eventBubble = (false !== c.common.apply(conf.events.click, $row, row, e, $row));
                if (eventBubble) {
                    Table.logger && Table.logger.info('点击表格行');
                    $(this).find('.' + Table.style.selection).click();
                }
            });
        })();

        // 功能列
        var cellSelector = rowClassSelector + ' > .' + style.table_cell;
        (function () {
            // extend
            c.$common.uniqueDelegate(conf.templates.$bounds, cellSelector + ' > .' + style.expander, 'click', function (e) {
                Table.logger && Table.logger.info('点击扩展');
                c.$common.stopPropagation(e);
                var
                    $this = $(this),
                    $row = $this.parents('.' + Table.style.table_row),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];

                // 当前已展开, 执行关闭逻辑
                var $expandRow = conf.expandIndexedCache[rowDataKey];

                // 展开逻辑
                if (!$expandRow) {
                    var colSpanValue = conf.headers.length;
                    $expandRow = Table.creator.expandContainer(colSpanValue);
                    if (false === c.common.apply(conf.events.expandOpen, $row, row, $expandRow, e, $row)) {
                        Table.logger && Table.logger.log('expandOpen 事件阻止打开扩展行');
                    } else {
                        conf.expandIndexedCache[rowDataKey] = $expandRow;
                        var
                            typedHeaderMap = c.arrays.asMap(conf.headers, 'type'),
                            headConf = typedHeaderMap['expand'],
                            $tpl = headConf.template.clone(true);
                        $expandRow.find('.' + Table.style.expand_container).append($tpl);
                        $row.after($expandRow);
                        $this.addClass(Table.style.expander_opened);
                        c.common.timer(function () {
                            c.common.apply(conf.events.expandOpened, $row, row, $expandRow, e, $row);
                        }, 50);
                        Table.logger && Table.logger.log('添加扩展模板');
                    }
                    return;
                }

                // 关闭逻辑
                if (false === c.common.apply(conf.events.expandClose, $row, row, $expandRow, e, $row)) {
                    Table.logger && Table.logger.log('expandClose 事件阻止关闭扩展行');
                } else {
                    $expandRow.remove();
                    delete conf.expandIndexedCache[rowDataKey];
                    $this.removeClass(Table.style.expander_opened);
                    c.common.timer(function () {
                        c.common.apply(conf.events.expandClosed, $row, row, $expandRow, e, $row);
                    }, 50);
                    Table.logger && Table.logger.log('删除扩展模板');
                }
            });
            // selection radio
            var bodyRadioClassSelector = rowClassSelector + ' > .' + style.table_cell + ' > .' + style.selection_radio;
            c.$common.uniqueDelegate(conf.templates.$bounds, bodyRadioClassSelector, 'click', function (e) {
                c.$common.stopPropagation(e);
                Table.logger && Table.logger.info('点击单选框');

                var
                    $this = $(this),
                    $row = $this.parents('.' + Table.style.table_row),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];

                conf.selectionDataUniqueIndex.length = 0;
                conf.selectionDataUniqueIndex.push(rowDataKey);
                c.common.apply(conf.events.action, $row, row, [row], e, $row);
            });
            // selection checkbox
            var bodyCheckboxClassSelector = rowClassSelector + ' > .' + style.table_cell + ' > .' + style.selection_checkbox;
            c.$common.uniqueDelegate(conf.templates.$bounds, bodyCheckboxClassSelector, 'click', function (e) {
                c.$common.stopPropagation(e);
                Table.logger && Table.logger.info('点击复选框');

                var
                    $this = $(this),
                    $row = $this.parents('.' + Table.style.table_row),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];

                if ($this.is(':checked')) {
                    conf.selectionDataUniqueIndex.push(rowDataKey);
                    c.arrays.unique(conf.selectionDataUniqueIndex);
                } else {
                    c.arrays.remove(conf.selectionDataUniqueIndex, rowDataKey);
                }

                var rows = c.objects.values(conf.uniqueIndexedData, conf.selectionDataUniqueIndex);
                c.common.apply(conf.events.action, row, row, rows, $row);
            });
        })();

        // [data-writable]数据被改变
        (function () {
            var bodyEditorClassSelector = cellSelector + ' > .' + style.editable_container + ' [name]';
            c.$common.uniqueDelegate(conf.templates.$bounds, bodyEditorClassSelector, 'click', function (e) {
                e.stopPropagation();
            });
            c.$common.uniqueDelegate(conf.templates.$bounds, bodyEditorClassSelector, 'focus', function (e) {
                e.stopPropagation();
            });
            c.$common.uniqueDelegate(conf.templates.$bounds, bodyEditorClassSelector, 'change', function () {
                var
                    $this = $(this),
                    $cell = $this.parents('.' + Table.style.table_cell),
                    cellIndex = $cell.index(),
                    headConf = conf.headers[cellIndex],
                    $row = $this.parents('.' + Table.style.table_row),
                    rowDataKey = $row.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];
                Table.logger && Table.logger.log('数据被修改', row);

                if (!row) {
                    Table.logger && Table.logger.log('未找到相关数据 rowDataKey[' + rowDataKey + ']');
                    return;
                }

                if (!headConf)
                    throw '未找到当前列表头配置, 列索引[' + cellIndex + ']';
                try {
                    updateCells($row, row, headConf, $this.val(), conf);
                } catch (e) {
                    var defaultValue = $this.attr(Table.defineHtmlKey.editable_previous_value);
                    $this.val(defaultValue);
                    // TODO 这里需要给用户预留错误处理事件
                    throw e;
                }
            });
        })();

        // 表头激活(选中)/释放(取消)所有数据行
        (function () {
            var headerCheckboxClassSelector
                = '.' + style.table_header
                + '>.' + style.table_header_row
                + '>.' + style.table_header_cell
                + '>.' + style.selection_checkbox;
            c.$common.uniqueDelegate(conf.templates.$bounds, headerCheckboxClassSelector, 'click', function (e) {
                e.stopPropagation();
                var
                    $this = $(this),
                    isAction = $this.is(':checked');
                Table.logger && Table.logger.log((isAction ? '激活' : '释放') + '所有数据行');

                conf.templates.$bounds.find('.' + Table.style.selection_checkbox).prop('checked', isAction);
                conf.selectionDataUniqueIndex.length = 0;
                if (isAction)
                    conf.selectionDataUniqueIndex = c.objects.keys(conf.uniqueIndexedData);

                var
                    $lastRow = conf.templates.$main.find(' > .' + Table.style.table_body + ':first' + ' > .' + Table.style.table_row + ':last'),
                    rows = c.objects.values(conf.uniqueIndexedData, conf.selectionDataUniqueIndex),
                    rowDataKey = $lastRow.attr(Table.defineHtmlKey.row_data_key),
                    row = conf.uniqueIndexedData[rowDataKey];
                c.common.apply(conf.events.action, row, row, rows, $lastRow);
            });
        })();
    }

    /**
     * 重新计算列宽
     * @param conf {*} 表格插件配置
     */
    function calcColumnWidthByModifierTrigger(conf) {
        conf.templates.$bounds.removeClass(Table.style.column_width_editing);
        var $trigger = conf.widthModifier.$trigger;
        if (!$trigger)
            return;

        var
            triggerIndex = $trigger.index(),
            fromX = $trigger.attr(Table.defineHtmlKey.column_activator_from_x),
            toX = $trigger.attr(Table.defineHtmlKey.column_activator_to_x),
            movedSize = toX - fromX;

        // 表头单元格调整
        // 数据行自动根据表头宽度适应
        var $header = conf.templates.$main
            .find('>.' + Table.style.table_header + '>.' + Table.style.table_header_row)
            .find('>.' + Table.style.table_header_cell)
            .eq(triggerIndex);
        $header.width($header.width() + movedSize);

        // 释放触发器
        conf.widthModifier.$trigger.removeClass(Table.style.trigger_action);
        conf.widthModifier.$trigger = null;

        // 刷新触发器位置
        activeColumnWidthModifier(conf);
    }

    /**
     * 更新所有单元格(与指定单元格拥有相同prop配置)
     * @param $row {jQuery} 数据行控件
     * @param row {*} 行数据
     * @param headConf {*} 触发单元格控件
     * @param newlyValue {*} 新值
     * @param conf {*} 表格插件配置
     */
    function updateCells($row, row, headConf, newlyValue, conf) {

        // 匹配所有相关列索引
        var cellIndexes = [];
        c.common.each(conf.headers, function (hc, hi) {
            if (hc.prop === headConf.prop)
                cellIndexes.push(hi);
        });

        // 值格式化按照第一个已存在的配置
        // date 需要做格式化处理
        var firstHeadConf = conf.headers[cellIndexes[0]];
        if ('date' === firstHeadConf.type) {
            var date = c.dates.parse(newlyValue, firstHeadConf.dateFormat);
            if (!c.valid.isDate(date))
                throw '无效日期字符串[' + newlyValue + ']规则[' + firstHeadConf.dateFormat + ']';
            newlyValue = date.getTime();
        }
        row[headConf.prop] = newlyValue;

        // 渲染相关列视图
        var rowIndex = $row.index();
        c.common.each(cellIndexes, function (headIndex) {
            var _headConf = conf.headers[headIndex];
            if (headConf !== _headConf) {
                var $cell = createCell(_headConf, row, headIndex, rowIndex, conf);
                $row.find('.' + Table.style.table_cell + ':eq(' + headIndex + ')').replaceWith($cell);
            }
        });
    }

    /**
     * 填充数据行
     * @param $table {jQuery} 表格控件
     * @param conf {*} 表格配置
     */
    function fillRows($table, conf) {
        var $tbody = $table.find('tbody');
        if (!$tbody.length)
            ($tbody = Table.creator.tbody).appendTo($table).addClass(Table.style.table_body);

        if (!conf.data.length) {
            createEmptyRow($tbody, conf);
            return;
        }

        // 填充数据行
        $tbody.html('');
        c.common.each(conf.data, function (row, rowIndex) {
            var $row = createRow(row, conf, rowIndex);
            $tbody.append($row);
        });
    }

    /**
     * 创建行控件
     * @param row {*} 行数据
     * @param conf {*} 表格插件配置
     * @param rowIndex {Number} 行索引
     */
    function createRow(row, conf, rowIndex) {
        var
            $row = Table.creator.tr,
            uniqueKey;
        do {
            uniqueKey = 'uk' + (Math.random() + '').substring(2);
        } while (conf.uniqueIndexedData[uniqueKey]) ;
        conf.uniqueIndexedData[uniqueKey] = row;
        $row.attr(Table.defineHtmlKey.row_data_key, uniqueKey);

        c.common.each(conf.headers, function (headConf, cellIndex) {
            var $cell = createCell(headConf, row, cellIndex, rowIndex, conf);
            $row.append($cell);
        });
        return $row;
    }

    /**
     * 创建单元格控件
     * @param headConf {*} 表头配置
     * @param row {*} 行数据
     * @param index {Number} 单元格索引/下标
     * @param rowIndex {Number} 行索引
     * @param conf {*} 表格插件配置
     * @return {*} 单元格控件
     */
    function createCell(headConf, row, index, rowIndex, conf) {
        var
            $cell = Table.creator.td,
            val = c.ognl.getValue(row, headConf.prop),
            typeHandlers = {
                index: function () {
                    Table.logger && Table.logger.info('创建 index 列');
                    $cell.text(+rowIndex + 1);
                },
                selection: function () {
                    Table.logger && Table.logger.info('创建 selection 列');
                    var $box = Table.creator[('radio' === headConf.selection) ? 'radio' : 'checkbox'];
                    $cell.append($box);
                },
                expand: function () {
                    Table.logger && Table.logger.info('创建 expand 列');
                    $cell.prepend(Table.creator.expander);
                },
                text: function () {
                    Table.logger && Table.logger.info('创建 text 列');
                    $cell.text(val);
                },
                enum: function () {
                    Table.logger && Table.logger.info('创建 enum 列');
                    $cell.text(val ? headConf.enum[val] : '');
                },
                date: function () {
                    Table.logger && Table.logger.info('创建 date 列');
                    var formattedDate = val ? c.dates.format(val, headConf.dateFormat) : '';
                    $cell.text(formattedDate)
                },
                html: function () {
                    Table.logger && Table.logger.info('创建 html 列');
                    $cell.html(val);
                },
                template: function () {
                    Table.logger && Table.logger.info('创建 template 列');
                    $cell.html('').append(headConf.template.clone(true));
                }
            };
        c.common.apply(typeHandlers[headConf.type], typeHandlers);

        if (headConf.writable) {
            var $editable = renderWritable(row, headConf, val);
            $cell.html($editable);
        }

        return $cell;
    }

    /**
     * 渲染可编辑控件
     * @param row {*} 行数据
     * @param headConf {*} 表头配置
     * @param val {String} 值
     * @return {*} 可编辑控件
     */
    function renderWritable(row, headConf, val) {
        // 使用 [data-writable] 模板
        if (headConf.$writable) {
            var
                $writable = headConf.$writable.clone(true),
                typeHandlers = {
                    text: function (val) {
                        return val;
                    },
                    enum: function (val) {
                        return val;
                    },
                    date: function (val) {
                        return val ? c.dates.format(val, headConf.dateFormat) : '';
                    },
                    html: function (val) {
                        return val;
                    }
                };
            var handler = typeHandlers[headConf.type];
            if (!c.valid.isFunction(handler))
                throw '该类型(' + headConf.type + ')不支持可编辑逻辑';
            c.common.apply(handler, typeHandlers);
            $writable.addClass(Table.style.editable_container).find('[name]').val(val);
            return $writable;
        }

        // 无 [data-writable] 模板
        var creator = Table.writableCreator[headConf.type];
        if (c.valid.isFunction(creator)) {
            var
                param = {
                    value: val,
                    options: c.objects.asArrayByFirstProperty(headConf.enum, 'value', 'text'),
                    headConf: headConf
                };
            var
                $child = c.common.apply(creator, row, param),
                $editableContainer = Table.writableCreator.editableContainer();
            $child.attr(Table.defineHtmlKey.editable_previous_value, param.value);
            return $editableContainer.html($child);
        } else {
            Table.logger && Table.logger.log('[ ' + headConf.type + ' ]类型不支持可编辑逻辑(data-writable)');
        }
    }

    /**
     * 删除空数据行
     * @param $tbody {jQuery} Table TBody控件
     */
    function clearEmptyRow($tbody) {
        $tbody.find('.' + Table.style.table_empty_row).remove();
    }

    /**
     * 创建空数据行
     * @param $tbody {jQuery} Table TBody 控件
     * @param conf {*} 表格插件配置
     */
    function createEmptyRow($tbody, conf) {
        $tbody.html('');
        var
            $row = Table.creator.tr.addClass(Table.style.table_row).addClass(Table.style.table_empty_row),
            $td = Table.creator.td.addClass(Table.style.empty_td)
                .text('没有找到数据')
                .attr({
                    colSpan: conf.headers.length,
                    'style': 'text-align:center;'
                });
        $row.append($td).appendTo($tbody);
    }

    /**
     * 模板替换
     * @param conf {*} 表格组件配置
     */
    function replaceWithTemplate(conf) {
        var $template = $('<div>').attr(Table.defineHtmlKey.bounds_key, conf._key).addClass(Table.style.bounds);
        conf.templates.$bounds = $template;

        // 主视图容器
        conf.templates.$main = $('<table>').addClass(Table.style.table);
        conf.templates.$main.appendTo($template);
        createHeaders(conf, conf.templates.$main);

        // 顶部固定视图
        if (0 < conf.maxHeight) {
            conf.templates.$bounds.css({height: conf.maxHeight, overflow: 'auto'});
            var $top = $('<div>').addClass(Table.style.fixed_header_container).appendTo(conf.templates.$bounds);
            conf.templates.$top = $('<table>').addClass(Table.style.table).appendTo($top);
            createHeaders(conf, conf.templates.$top);
        }

        // TODO 左侧固定列视图
        // TODO 右侧固定视图

        conf.$table.replaceWith($template);
        activeColumnWidthModifier(conf);
    }

    /**
     * 创建表头
     * @param conf {*} 配置对象
     * @param $table {jQuery} 表格对象
     */
    function createHeaders(conf, $table) {
        var
            $head = $('<thead>').appendTo($table).addClass(Table.style.table_header),
            $row = $('<tr>').appendTo($head).addClass(Table.style.table_header_row);
        // $table.appendTo($template);
        c.common.each(conf.headers, function (headConf) {
            var $th = createHeader(headConf);
            $row.append($th);
        });
    }

    /**
     * 激活列宽调整
     * @param conf {*} 插件配置
     */
    function activeColumnWidthModifier(conf) {
        conf.templates.$bounds.find('>.' + Table.style.column_modifier).remove();
        var
            style = Table.style,
            leftOffset = 0;
        conf.templates.$main.find('>.' + style.table_header + '>.' + style.table_header_row + '>.' + style.table_header_cell)
            .each(function () {
                var
                    $this = $(this),
                    outerWidth = $this.outerWidth(),
                    $mover = Table.creator.columnModifier;
                $mover.css({
                    left: outerWidth + leftOffset - 2,
                    height: $this.outerHeight()
                });
                leftOffset += outerWidth - 1;
                conf.templates.$main.before($mover);
            });
        conf.templates.$bounds.find('>.' + Table.style.column_modifier + ':last').remove();
    }

    /**
     * 创建表头
     * @param headConf {*} 表头配置
     */
    function createHeader(headConf) {
        var $th = $('<th>').text(headConf.text).addClass(Table.style.table_header_cell);
        if (('selection' === headConf.type) && ('checkbox' === headConf.selection)) {
            var $thS = $('<input>', {type: 'checkbox', class: Table.style.selection_checkbox});
            $thS.prependTo($th);
        }
        return $th;
    }

    /**
     * 解析表头配置值
     * @param $th {jQuery} 表头控件
     * @return {*}
     */
    function parseHeaderConfig($th) {
        Table.logger && Table.logger.log('开始解析表头 >>>', $th);

        var
            dataSet = $th[0].dataset || {},
            headConfig = {
                type: dataSet.type || 'text',           // 'index|selection|expand|text|enum|date|html|template',
                selection: null,                        // 'radio|checkbox',
                prop: dataSet.prop || '',
                'enum': null,
                dateFormat: dataSet.dateFormat || '',   // 'yyyy-MM-dd hh:mm:ss:S',
                text: null, //dataSet.text || $th.text() || '',
                template: null,
                $origin: $th,
                writable: false,
                $writable: null
            };

        // [data-writable]
        headConfig.writable = !c.valid.nullOrUndefined(dataSet.writable);
        if (headConfig.writable) {
            var $definition = $th.find('[' + Table.defineHtmlKey.editable_template + ']:first');
            headConfig.$writable = ($definition.length && $definition.find('[name]:first').length) ? $definition : null;
        }

        if (!(headConfig.text = dataSet.text)) {
            c.common.each($th[0].childNodes, function (node) {
                if (c.valid.isTextNode(node)) {
                    headConfig.text = node.textContent;
                    return false;
                }
            });
        }
        headConfig.text = $.trim(headConfig.text);

        // selection: type=radio|checkbox
        if ('selection' === headConfig.type) {
            (function () {
                var selection = dataSet.selection || 'checkbox';
                switch (selection.toLowerCase()) {
                    case 'radio':
                    case 'checkbox':
                        headConfig.selection = selection;
                        break;
                    default:
                        var
                            err = '无效的表头配置',
                            html = $th[0].outerHTML.split('\n')[0];
                        err += '\n' + html;
                        var index = html.indexOf('data-selection');
                        err += '\n' + c.strings.repeat(' ', index) + '^^^^';
                        throw err;
                }
            })();
        }

        // expand: type=expand
        else if ('expand' === headConfig.type) {
            (function () {
                var $tpl = $th.find('[data-expand]:first').hide();
                headConfig.template = $tpl.clone(true).show();
                if (!headConfig.template.length) {
                    var
                        err = '无效的表头配置, 表头控件内未找到expand模板 (<div data-expand>扩张行模板内容</div>)',
                        html = $th[0].outerHTML.split('\n')[0];
                    err += '\n' + html;
                    var index = html.indexOf('data-type="expand"');
                    err += '\n' + c.strings.repeat(' ', index) + '^^^^';
                    throw err;
                }
            })();
        }

        // enum: type=enum
        else if ('enum' === headConfig.type) {
            (function () {
                var
                    enumStr = dataSet['enum'],
                    _enum = null;
                // 常规JSON转换
                try {
                    _enum = JSON.parse(enumStr);
                } catch (ignore) {
                }
                // 非常规JSON转换
                try {
                    _enum = eval('(' + enumStr + ')');
                } catch (e) {
                }
                if (!(_enum && c.valid.isObject(_enum))) {
                    var
                        err = '无效的表头配置',
                        html = $th[0].outerHTML.split('\n')[0];
                    err += '\n' + html;
                    var index = html.indexOf('data-enum');
                    err += '\n' + c.strings.repeat(' ', index) + '^^^^';
                    throw err;
                }
                headConfig['enum'] = _enum;
            })();
        }

        // template: type=template
        else if ('template' === headConfig.type) {
            (function () {
                var $tpl = $th.find('[data-template]:first').hide();
                headConfig.template = $tpl.clone(true).show();
                if (!headConfig.template.length) {
                    var
                        err = '无效的表头配置, 表头控件内未找到template模板 (<div data-template>模板内容</div>)',
                        html = $th[0].outerHTML.split('\n')[0];
                    err += '\n' + html;
                    var index = html.indexOf('data-type="template"');
                    err += '\n' + c.strings.repeat(' ', index) + '^^^^';
                    throw err;
                }
            })();
        }

        Table.logger && Table.logger.log('完成解析表头 >>>', $th, headConfig);
        return headConfig;
    }

    /**
     * 解析表格容器配置
     * @param $table {jQuery} 表格控件
     * @param conf {*} 表格组件配置
     */
    function parseTableConfig($table, conf) {
        conf.$table = $table;

        var tableDataSet = $table[0].dataset || {
            pagination: null,
            url: null,
            reload: null,
            sizes: null,
            count: null,
            layout: null,
            maxHeight: -1
        };

        // 启用pagination插件
        if (!c.valid.nullOrUndefined(tableDataSet.pagination)) {
            c.objects.copyProps(tableDataSet, conf.pagination);
            conf.pagination._enable = true;
            delete conf.pagination.pagination;
            if (!c.valid.isFunction(c.Pager))
                throw '未检测到Pager插件';
        }

        // 启用固定表头
        if (0 < tableDataSet.maxHeight)
            conf.maxHeight = +tableDataSet.maxHeight;

    }

    /**
     * 获取配置
     * @param self {Table} 表格对象
     * @param [$c] {jQuery|Element} 表格容器对象
     * @param [checkAlive=true] {Boolean} true-destroy校验
     * @return {*}
     */
    function getConf(self, $c, checkAlive) {
        var conf = Table.cache[self.key] = (Table.cache[self.key] || {
            _key: self.key,
            self: self,
            data: null, // 原数据
            uniqueIndexedData: {},  // 原数据额外索引: K-RowDataUniqueIndex, V-RowData
            expandIndexedCache: {}, // 展开行缓存: K-RowDataUniqueIndex,V-jQuery,
            selectionDataUniqueIndex: [],      // 选中的数据索引
            events: {
                cellReady: null,    // 单元格准备就绪, 挂载到行视图前
                rowReady: null,     // 行视图准备就绪, 挂载到表格控件前
                updated: null,      // 表格刷新后
                mouseEnter: null,   // 鼠标进入数据行
                mouseLeave: null,   // 鼠标离开数据行
                click: null,        // 点击数据行
                action: null,       // 选中数据行
                expandOpen: null,           // 扩展行打开前
                expandOpened: null,         // 扩展行打开后
                expandClose: null,          // 扩展行关闭前
                expandClosed: null          // 扩展行关闭后

            },
            $container: c.valid.isJQuery($c) ? $c : $($c),
            $table: null,       // 原表格控件
            templates: {
                $bounds: null,  // 主容器
                $main: null,    // 主视图
                $left: null,    // 左侧列定位
                $right: null,   // 右侧列定位
                $top: null      // 表头定位
            },
            headers: [],
            swapper: {
                $start: null,       // 起始列
                $target: null       // 结束列
            },
            widthModifier: {
                $trigger: null        // 激活的宽度调节器
            },
            pagination: {
                _enable: false,      // 是否启用Pager插件,
                events: {},         // 委托事件
                $container: null,   // Pager容器
                $pager: null,       // Pager插件依赖视图
                pager: null,        // Pager插件实例
                url: null,
                reload: null,
                sizes: null,
                count: null,
                layout: null
            },
            maxHeight: -1,
            loaded: false,
            destroyed: false,
            dev: false
        });
        if ((checkAlive || c.valid.nullOrUndefined(checkAlive)) && conf.destroyed)
            throw '已卸载插件, 无法继续使用';
        return conf;
    }

    Table.logger && Table.logger.info('载入Logger API', Table.dir = {
        api: Table.prototype,
        '[[constructor]]': 'Table($container, autoInit, dev), $container-表格(容器使用内部使用table:first), autoInit-自动初始化, dev-调试模式打印更多日志',
        eg: 'var table = new jsu.Table($tableContainer);',
        egPagination: '自动加载分页插件需要配置示例:\n' +
        '<table class="table"\n' +
        '       data-pagination\n' +
        '       data-url=\'Page.jsp\'\n' +
        '       data-reload=\'true\'\n' +
        '       data-sizes=\'10,20,50,100\'\n' +
        '       data-count=\'7\'\n' +
        '       data-layout="total, sizes, prev, pager, next, jumper">'
    });

})(window.jsu = (window.jsu || {}));
