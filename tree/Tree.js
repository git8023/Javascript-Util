/**
 * 1. 编辑
 * TODO 2. 删除
 * TODO 3. 禁用/启用展开
 * TODO 4. 禁用/启用选中
 */
;(function (c) {
    'use strict';

    c.Tree = Tree;
    Tree.logger = jsu.Logger ? jsu.Logger('Tree') : null;

    // K - Tree Key
    // V - Tree instance
    Tree.cache = {};

    // class样式列表
    Object.defineProperties(Tree.style = {}, {
        bounds: {value: 'jsu-tree-bounds'},
        tree: {value: 'jsu-tree'},
        root: {value: 'jsu-tree-root'},
        node: {value: 'jsu-tree-node'},
        title: {value: 'jsu-tree-title'},
        text: {value: 'jsu-tree-text'},
        children: {value: 'jsu-tree-children'},
        hide: {value: 'jsu-tree-hide'},
        temporary_root: {value: 'jsu-tree-temporary-root'},
        expander: {value: 'jsu-tree-expander'},
        selection: {value: 'jsu-tree-selection'},
        selection_default: {value: 'jsu-tree-selection-default'},
        selection_activate: {value: 'jsu-tree-selection-activate'},
        children_loading: {value: 'jsu-tree-children-loading'},
        loading: {value: 'jsu-tree-loading'},
        other: {value: 'jsu-tree-other'},
        other_container: {value: 'jsu-tree-other-container'},
        node_selected: {value: 'jsu-tree-node-selected'},
        editing: {value: 'jsu-tree-node-editing'},

        editor: {value: 'jsu-tree-activate-editor'},
        delete: {value: 'jsu-tree-activate-delete'},
        append: {value: 'jsu-tree-activate-append'}
    });

    // 创建相关
    Object.defineProperties(Tree.creator = {}, {
        temporaryRoot: {
            value: function (conf) {
                return Tree.creator.node(conf, {}).addClass(Tree.style.temporary_root);
            }
        },
        root: {
            value: function (conf, node) {
                return Tree.creator.node(conf, node).addClass(Tree.style.root);
            }
        },
        node: {
            value: function (conf, node) {
                var $node = $('<div>').addClass(Tree.style.node).addClass(Tree.readers.class(node));
                $node.attr(Tree.defineHtmlKey.node_key, c.objects.getKeyByValue(conf.dataSet.dataMap, node));
                $node.append(Tree.creator.title(conf, node));
                return $node;
            }
        },
        title: {
            value: function (conf, node) {
                var $title = $('<div>').addClass(Tree.style.title);

                // 展开标记
                var $expander = $('<i>').addClass('fa fa-caret-right')
                    .addClass(Tree.style.expander);
                $title.append($expander);

                // 未选中标记
                var $selectionDefault = $('<i>').addClass('fa fa-square-o')
                    .addClass(Tree.style.selection)
                    .addClass(Tree.style.selection_default);
                $title.append($selectionDefault);

                // 已选中标记
                var $selectionActivate = $('<i>').addClass('fa fa-check-square-o')
                    .addClass(Tree.style.selection)
                    .addClass(Tree.style.selection_activate);
                $title.append($selectionActivate);

                // 加载中标记
                var $loading = $('<i>').addClass('fa fa-spinner fa-pulse')
                    .addClass(Tree.style.loading);
                $title.append($loading);

                // 文本
                var $text = $('<span>', {html: Tree.readers.text(node)})
                    .addClass(Tree.style.text);
                $title.append($text);

                // 右侧其他功能
                $title.append(Tree.creator.other(conf));

                return $title;
            }
        },
        other: {
            value: function (conf) {
                var
                    $other = $('<span>').addClass(Tree.style.other),
                    $c = $('<div>').addClass(Tree.style.other_container).appendTo($other);
                // 编辑
                $c.append($('<i>').addClass('fa fa-edit').addClass(Tree.style.editor));
                // 删除
                $c.append($('<i>').addClass('fa fa-trash-o').addClass(Tree.style.delete));
                // 插入子节点
                $c.append($('<i>').addClass('fa fa-indent').addClass(Tree.style.append));
                return $other;
            }
        },
        children: {
            value: function (conf, node, $node) {
                var $children = $('<div>').addClass(Tree.style.children);
                c.common.each(Tree.readers.children(node), function (childNode) {
                    Tree.creator.node(conf, childNode).appendTo($children);
                });
                $children.appendTo($node);
                return $children;
            }
        }
    });

    // 自定义HTML属性名
    Object.defineProperties(Tree.defineHtmlKey = {}, {
        bounds_key: {value: 'data-tree'},
        node_key: {value: 'data-tree-node'}
    });

    //  数据获取相关
    Object.defineProperties(Tree.readers = {}, {
        text: {
            value: function (node) {
                return c.strings.trim(node['text'] || '');
            }
        },
        class: {
            value: function (node) {
                return c.strings.trim(node['class'] || '');
            }
        },
        children: {
            value: function (node) {
                var rightType = node && c.valid.isArray(node.children);
                return rightType ? node.children : [];
            }
        }
    });

    // 设置数据相关
    Object.defineProperties(Tree.writter = {}, {
        text: {
            value: function (node, value) {
                node['text'] = value;
            }
        }
    });

    /**
     * 分页插件
     * @constructor
     * @param $origin {jQuery|Element} 容器
     * @param autoInit {Boolean} true-自动初始化
     * @param dev {Boolean} true-调试模式, 打印更多日志
     * @return {Tree}
     */
    function Tree($origin, autoInit, dev) {
        if (!(this instanceof Tree))
            return new Tree($origin, autoInit, dev);
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
            Tree.logger = null;
        }

        // 自动初始化
        if (autoInit)
            this.init();

        Tree.logger && Tree.logger.info('初始化Form对象完成', this);
    }

    /**
     * 初始化
     */
    Tree.prototype.init = function () {
        var conf = getConf(this, null, false);
        if (conf.loaded) {
            Tree.logger && Tree.logger.info('跳过重复初始化');
            return;
        }
        conf.loaded = true;
        conf.destroyed = false;
        Tree.logger && Tree.logger.info('开始初始化 >>> ', conf);

        // 创建替换模板
        replaceWithTemplate(conf);

        // 激活事件
        activateEvents(conf);

        // 首次初始化
        // var updated = conf.events.updated;
        // delete conf.events.updated;
        // this.data([]);
        // conf.events.updated = updated;

        c.common.apply(conf.events.loaded, this);
        Tree.logger && Tree.logger.info('初始化完成 <<< ', conf);
    };

    /**
     * 卸载
     */
    Tree.prototype.destroy = function () {
        var conf = getConf(this);
        conf.templates.$bounds.replaceWith(conf.$origin);
        conf.loaded = false;
        conf.destroyed = true;
        c.common.apply(conf.events.destroyed, this);
    };

    /**
     * 设置/获取数据
     * @param data {Array} 设置数据
     * @return {*} 获取数据
     */
    Tree.prototype.data = function (data) {
        this.init();

        var conf = getConf(this);
        if (c.valid.nullOrUndefined(data)) {
            var ret = c.objects.clone(conf.dataSet.data);
            Tree.logger && Tree.logger.log('获取数据', ret);
            return ret;
        }

        Tree.logger && Tree.logger.log('设置数据', data);
        if (!c.valid.isArray(data)) {
            Tree.logger && Tree.logger.warn('树控件数据必须是Array实例: ', Object.prototype.toString.call(data));
            return;
        }


        var backup = conf.dataSet.data;
        try {
            rendererTree(conf, data);
            c.common.apply(conf.events.updated, this);
        } catch (e) {
            Tree.logger && Tree.logger.warn('更新视图异常, 正在尝试还原上一次正确数据', backup, e);
            rendererTree(conf, backup);
        }
    };

    /**
     * 获取/设置展开节点数据
     * @param [nodes] {Object|Array} 设置单个或多个节点展开, 注意该参数是消耗品
     * @param [dataKey] {string} 节点数据唯一值的属性名
     * @return {Array} 当前展开的节点
     */
    Tree.prototype.expandNode = function (nodes, dataKey) {
        var conf = getConf(this);
        if (!c.valid.nullOrUndefined(nodes)) {
            if (!c.valid.isArray(nodes))
                nodes = [nodes];
            var nodeKeys = [];
            c.common.each(conf.dataSet.dataMap, function (node, nodeKey) {
                if (c.arrays.remove(nodes, node, dataKey).length)
                    c.arrays.push(nodeKeys, nodeKey);
            });

            if (!nodeKeys.length) {
                Tree.logger && Tree.logger.warn('节点数据中没有任何与参数相关的数据', nodes);
                return [];
            }

            // 收起未展开的根节点
            var openedNodeKeys = c.arrays.remove(nodeKeys, conf.dataSet.expand);
            c.arrays.remove(conf.dataSet.expand, openedNodeKeys);
            c.common.each(conf.dataSet.expand, function (nodeKey) {
                conf.templates.$tree
                    .find('[' + Tree.defineHtmlKey.node_key + '="' + nodeKey + '"]')
                    .find('>.' + Tree.style.title)
                    .click();
            });
            c.arrays.push(conf.dataSet.expand, openedNodeKeys);

            // 展开子节点
            var maxCount = 10000;
            while (nodeKeys.length && (0 < --maxCount)) {
                c.common.each(nodeKeys, function (nodeKey) {
                    var
                        $node = conf.templates.$tree.find('[' + Tree.defineHtmlKey.node_key + '="' + nodeKey + '"]'),
                        $expandTrigger = $node.find('.' + Tree.style.title);
                    if ($expandTrigger.length) {
                        $expandTrigger.click();
                        c.arrays.remove(nodeKeys, nodeKey);
                    }
                });
            }

            if (nodeKeys.length)
                Tree.logger && Tree.logger.warn('执行10000次搜索后任有未找到的节点数据', nodes);
        }

        nodes = [];
        c.common.each(conf.dataSet.expand, function (nodeKey) {
            nodes.push(conf.dataSet.dataMap[nodeKey]);
        });
        Tree.logger && Tree.logger.log('获取展开节点', nodes);
        return nodes;
    };

    /**
     * 获取/设置选中节点数据
     * @param [nodes] {Object|Array} 设置单个或多个选中的节点, 如果存在并自动展开
     * @param [dataKey] {string} 节点数据唯一值属性名
     */
    Tree.prototype.activateNode = function (nodes, dataKey) {
        var conf = getConf(this);
        if (c.valid.nullOrUndefined(nodes)) {
            var activateNodes = [];
            c.common.each(conf.dataSet.action, function (nodeKey) {
                activateNodes.push(conf.dataSet.dataMap[nodeKey]);
            });
            Tree.logger && Tree.logger.log('已选中节点', activateNodes);
            return activateNodes;
        }

        // 清空已选择节点
        conf.dataSet.action.length = 0;
        conf.templates.$tree.find('.' + Tree.style.node_selected).removeClass(Tree.style.node_selected);

        if (!c.valid.isArray(nodes))
            nodes = [nodes];
        var nodeKeys = [];
        c.common.each(conf.dataSet.dataMap, function (node, nodeKey) {
            if (c.arrays.remove(nodes, node, dataKey).length)
                c.arrays.push(nodeKeys, nodeKey);
        });
        if (!nodeKeys.length) {
            Tree.logger && Tree.logger.warn('节点数据中没有任何与参数相关的数据', nodes);
            return [];
        }

        // 向上展开所有父节点
        c.common.each(nodeKeys, function (nodeKey) {
            var parentKeys = conf.dataSet.upperLevels[nodeKey];

            // 展开父节点队列
            if (c.valid.isArray(parentKeys)) {
                c.common.each(c.arrays.reverse(parentKeys, true, true), function (nodeKey) {
                    expandChildren(conf, nodeKey);
                    conf.templates.$tree.find('[' + Tree.defineHtmlKey.node_key + '="' + nodeKey + '"]').addClass(Tree.style.node_selected);
                    c.arrays.push(conf.dataSet.action, nodeKey);
                });
            }

            // 选中当前节点
            conf.templates.$tree.find('[' + Tree.defineHtmlKey.node_key + '="' + nodeKey + '"]').addClass(Tree.style.node_selected);
            c.arrays.push(conf.dataSet.action, nodeKey);
        });

    };

    /**
     * 注册事件
     * @param events {*} 事件对象
     */
    Tree.prototype.events = function (events) {
        var conf = getConf(this);
        c.common.each(conf.events, function (fn, eK) {
            conf.events[eK] = c.valid.isFunction(events[eK]) ? events[eK] : fn;
        });
        Tree.logger && Tree.logger.log('注册事件完成', conf);
        return conf.events;
    };

    /**
     * 渲染节点
     * @param conf {*} 配置
     * @param data {Array} 控件数据
     */
    function rendererTree(conf, data) {
        updateCached(conf, data);

        var $tree = conf.templates.$tree.html('');
        c.common.each(data, function (node) {
            var $root = Tree.creator.root(conf, node);
            if (false !== c.common.apply(conf.events.beforeAppend, this, $root, node, 'root')) {
                $tree.append($root);
                c.common.apply(conf.events.afterAppend, this, $root, node, 'root');
                Tree.logger && Tree.logger.log('追加根节点', node, conf);
            } else {
                Tree.logger && Tree.logger.log('阻止追加根节点', node, conf);
            }
        });
    }

    /**
     * 更新缓存
     * @param conf {*} 配置
     * @param data {Array} 数据
     */
    function updateCached(conf, data) {
        conf.dataSet.data = data;
        conf.dataSet.dataMap = {};
        conf.dataSet.upperLevel = {};
        conf.dataSet.upperLevels = {};
        c.common.each(data, cache);

        // 更新子节点 -> 父节点列表关系
        // 父节点关系: self -> [pn, ..., p, root]
        c.common.each(conf.dataSet.upperLevel, function (parentNodeKey, nodeKey) {
            var parentNodeKeys = conf.dataSet.upperLevels[nodeKey] = [parentNodeKey];
            while (!c.valid.nullOrUndefined(parentNodeKey = conf.dataSet.upperLevel[parentNodeKey]))
                c.arrays.push(parentNodeKeys, parentNodeKey);
        });

        function cache(node, parentNode) {
            if (!node) return;
            var key = c.common.uuid(false, true);
            conf.dataSet.dataMap[key] = node;

            // 记录关系: 子集 -> 父级
            // 父级 -> 子集由children属性完成
            if (c.valid.isObject(parentNode))
                conf.dataSet.upperLevel[key] = c.objects.getKeyByValue(conf.dataSet.dataMap, parentNode);

            var children = Tree.readers.children(node);
            if (c.valid.isArray(children)) {
                c.common.each(children, function (_node) {
                    cache(_node, node);
                });
            }
        }
    }

    /**
     * 激活事件
     * @param conf {*} 配置
     */
    function activateEvents(conf) {
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Tree.style.title, 'click', function (e) {
            c.$common.stopPropagation(e);
            var
                $this = $(this),
                $node = $this.parents('.' + Tree.style.node + ':first'),
                nodeKey = $node.attr(Tree.defineHtmlKey.node_key),
                node = conf.dataSet.dataMap[nodeKey];

            var isAppend = (-1 === conf.dataSet.expand.indexOf(nodeKey));
            Tree.logger && Tree.logger.log('点击节点 >> ', node, isAppend ? 'CLOSE' : 'EXPAND');

            if (isAppend) {
                expandChildren(conf, nodeKey);
            } else if (false !== c.common.apply(conf.events.beforeClose, this, node, $node)) {
                removeExpandByParent(conf, nodeKey);
                $node.find('>.' + Tree.style.children + ':first').slideUp(200, function () {
                    $(this).remove();
                    c.common.apply(conf.events.afterClose, this, node, $node)
                });
                Tree.logger && Tree.logger.log('关闭子节点', node, conf.dataSet.expand);
            } else {
                Tree.logger && Tree.logger.log('阻止关闭子节点', node, conf.dataSet.expand);
            }
        });
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Tree.style.selection, 'click', function (e) {
            c.$common.stopPropagation(e);
            var
                $node = $(this).parents('[' + Tree.defineHtmlKey.node_key + ']:first'),
                nodeKey = $node.attr(Tree.defineHtmlKey.node_key),
                node = conf.dataSet.dataMap[nodeKey],
                toActivate = (-1 === c.arrays.toggle(conf.dataSet.action, nodeKey));

            // 已存在 -> 删除
            // 不存在 -> 添加
            $node.toggleClass(Tree.style.node_selected);

            // 更新父级选中状态
            (function () {
                var parentNodeKey, parentNode, $parentNode, childKey = nodeKey;
                do {
                    if (!(parentNodeKey = conf.dataSet.upperLevel[childKey]))
                        break;
                    parentNode = conf.dataSet.dataMap[parentNodeKey];
                    $parentNode = conf.templates.$tree.find('[' + Tree.defineHtmlKey.node_key + '="' + parentNodeKey + '"]');
                    if (toActivate) {
                        $parentNode.addClass(Tree.style.node_selected);
                        c.arrays.push(conf.dataSet.action, parentNodeKey);
                    } else if (!$parentNode.find('.' + Tree.style.node_selected).length) {
                        $parentNode.removeClass(Tree.style.node_selected);
                        c.arrays.remove(conf.dataSet.action, parentNodeKey);
                    }
                    childKey = parentNodeKey;
                } while (childKey);
            })();

            // 更新子集选中状态
            (function () {
                var
                    $nodes = $node.find('[' + Tree.defineHtmlKey.node_key + ']'),
                    nodeKeys = [];
                $nodes.each(function () {
                    var nodeKey = $(this).attr(Tree.defineHtmlKey.node_key);
                    nodeKeys.push(nodeKey);
                });

                if (toActivate) {
                    $nodes.addClass(Tree.style.node_selected);
                    c.arrays.push(conf.dataSet.action, nodeKeys);
                } else {
                    $nodes.removeClass(Tree.style.node_selected);
                    c.arrays.remove(conf.dataSet.action, nodeKeys);
                }
            })();

            Tree.logger && Tree.logger.log(toActivate ? '选中' : '取消选中', nodeKey, node);
        });
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Tree.style.editor, 'click', function (e) {
            c.$common.stopPropagation(e);
            var
                $node = $(this).parents('[' + Tree.defineHtmlKey.node_key + ']:first'),
                $text = $node.find('>.' + Tree.style.title).find('>.' + Tree.style.text),
                nodeKey = $node.attr(Tree.defineHtmlKey.node_key),
                node = conf.dataSet.dataMap[nodeKey];

            var $editor = $('<input>', {value: Tree.readers.text(node)}).addClass(Tree.style.editing)
                .click(function (e) {
                    c.$common.stopPropagation(e);
                })
                .blur(function (e) {
                    c.$common.stopPropagation(e);
                    var text = c.strings.trim(this.value);
                    Tree.writter.text(node, text);
                    $text.text(text);
                    $editor.replaceWith($text);
                });
            $text.replaceWith($editor);
            c.common.timer(function () {
                $editor.focus().select();
            });
            Tree.logger && Tree.logger.log('编辑节点', node);
        });
        c.$common.uniqueDelegate(conf.templates.$bounds, '.' + Tree.style.delete, 'click', function (e) {
            c.$common.stopPropagation(e);
            var
                $node = $(this).parents('[' + Tree.defineHtmlKey.node_key + ']:first'),
                nodeKey = $node.attr(Tree.defineHtmlKey.node_key),
                node = conf.dataSet.dataMap[nodeKey];
            Tree.logger && Tree.logger.log('删除指定节点', node);
            $node.remove();
            removeNodeData(conf, nodeKey);
        });
    }

    /**
     * TODO 删除指定节点数据
     * @param conf {*} 配置
     * @param nodeKey {string} 节点key
     */
    function removeNodeData(conf, nodeKey) {
        var node = conf.dataSet.dataMap[nodeKey];

        // 缓存
        delete conf.dataSet.dataMap[nodeKey];

        // 通过属性流将指定节点从原始数据中删除
        c.AttributeStream.create(conf.dataSet.data)
            .next(function (node) {
                return Tree.readers.children(node);
            })
            .handle(function (v, k, o) {
                if (node === v) {
                    o.splice(k, 1);
                    return false;
                }
            })
            .start();

        // 选中的数据缓存
        c.arrays.remove(conf.dataSet.action, nodeKey);
        // TODO 展开的数据缓存
        // 从当前节点向下查找
        var parentsKey = [nodeKey];
        c.common.each(conf.dataSet.upperLevel, function (parentKey, childKey) {
            if (c.arrays.contains(parentsKey, parentKey))
                c.arrays.push(parentsKey, childKey);
        });
        c.arrays.remove(conf.dataSet.expand, parentsKey);
        // TODO 父级缓存
        // TODO 父级链缓存
        updateCached(conf, conf.dataSet.data);
    }

    /**
     * 展开子节点
     * @param conf {*} 配置
     * @param nodeKey {String} 节点key
     */
    function expandChildren(conf, nodeKey) {
        var
            node = conf.dataSet.dataMap[nodeKey],
            $node = conf.templates.$tree.find('[' + Tree.defineHtmlKey.node_key + '="' + nodeKey + '"]');

        if (c.arrays.contains(conf.dataSet.expand, nodeKey)) {
            Tree.logger && Tree.logger.log('跳过重复展开节点');
            return;
        }
        $node.addClass(Tree.style.children_loading);

        // 是否允许展开子节点
        if (false === c.common.apply(conf.events.beforeExpand, this, $node, node)) {
            $node.removeClass(Tree.style.children_loading);
            Tree.logger && Tree.logger.log('阻止展开子节点', node, conf.dataSet.expand);
            return;
        }

        // 是否允许追加子节点
        // 调整子节点视图
        var $children = Tree.creator.children(conf, node);
        if (false === c.common.apply(conf.events.beforeAppend, this, $node, node, 'children')) {
            $node.removeClass(Tree.style.children_loading);
            Tree.logger && Tree.logger.log('阻止追加子节点', node, conf);
            return;
        }

        // 追加子节点并使用动画展开
        c.arrays.push(conf.dataSet.expand, nodeKey);
        c.arrays.unique(conf.dataSet.expand);
        $children.appendTo($node).hide().slideDown(200, function () {
            c.common.apply(conf.events.afterExpand, this, $node, node);
        });
        c.common.apply(conf.events.afterAppend, this, $node, node, 'children');

        // 如果父节点被选中
        // 默认选中子节点
        // var parentNodeKey = conf.dataSet.upperLevel[nodeKey];
        if (c.arrays.contains(conf.dataSet.action, nodeKey))
            $children.find('[' + Tree.defineHtmlKey.node_key + ']')
                .addClass(Tree.style.node_selected)
                .each(function () {
                    var key = $(this).attr(Tree.defineHtmlKey.node_key);
                    c.arrays.push(conf.dataSet.action, key);
                });

        c.common.timer(function () {
            $node.removeClass(Tree.style.children_loading);
        }, 200);
    }

    /**
     * 移除nodeKey下所有children的expand状态
     * @param conf {*} 配置
     * @param nodeKey {string} 节点Key
     */
    function removeExpandByParent(conf, nodeKey) {
        var node = conf.dataSet.dataMap[nodeKey];
        c.arrays.remove(conf.dataSet.expand, nodeKey);
        c.common.each(Tree.readers.children(node), function (childNode) {
            var key = c.objects.getKeyByValue(conf.dataSet.dataMap, childNode);
            removeExpandByParent(conf, key);
        });
    }

    /**
     * 使用模板替换
     * @param conf {*} 配置
     */
    function replaceWithTemplate(conf) {
        var $c = conf.templates.$bounds = $('<div>').addClass(Tree.style.bounds).attr(Tree.defineHtmlKey.bounds_key, conf._key);
        conf.templates.$tree = $('<div>').addClass(Tree.style.tree).appendTo(conf.templates.$bounds);
        conf.$origin.replaceWith($c);
    }

    /**
     * 获取配置
     * @param self {Tree} 表格对象
     * @param [$c] {jQuery|Element} 表格容器对象
     * @param [checkAlive=true] {Boolean} true-destroy校验
     * @return {*}
     */
    function getConf(self, $c, checkAlive) {
        var conf = Tree.cache[self.key] = (Tree.cache[self.key] || {
            _key: self.key,
            self: self,
            $origin: c.valid.isJQuery($c) ? $c : $($c),
            templates: {
                $bounds: null,          // 主容器
                $tree: null             // 树控件
            },
            dataSet: {
                data: [],       // 控件数据
                dataMap: {},    // K-数据Key, V-节点数据
                expand: [],     // 展开的数据Key
                action: [],     // 选中的数据Key
                upperLevel: {}, // K-数据Key, V-父级数据Key
                upperLevels: {} // K-数据Key, V-父级数据Keys数组
            },
            events: {
                loaded: null,           // 加载完成
                destroyed: null,        // 卸载完成
                beforeAppend: null,     // 节点追加前
                afterAppend: null,      // 节点追加后
                updated: null,          // 更新完成,
                beforeExpand: null,     // 子节点展开前
                afterExpand: null,      // 子节点展开后
                beforeClose: null,      // 子节点关闭前
                afterClose: null        // 子节点关闭后
            },
            class: '',
            style: '',
            url: '',
            loaded: false,
            destroyed: false
        });
        if ((checkAlive || c.valid.nullOrUndefined(checkAlive)) && conf.destroyed)
            throw '已卸载插件, 无法继续使用';
        return conf;
    }

    Tree.logger && Tree.logger.info('载入Logger API', Tree.dir = {
        api: Tree.prototype,
        '[[constructor]]': 'Tree($origin, autoInit, dev), $origin-树控件容器, autoInit-自动初始化, dev-调试模式打印更多日志',
        eg: ''
    });

})(window.jsu = (window.jsu || {}));