;(function (c) {
    'use strict';
    c.Tree = Tree;
    Tree.logger = jsu.Logger ? jsu.Logger('Tree') : null;

    // K - Tree Key
    // V - Tree instance
    Tree.cache = {};

    Object.defineProperties(Tree.style = {}, {
        bounds: {value: 'jsu-tree-bounds'},
        tree: {value: 'jsu-tree-tree'},
        node: {value: 'jsu-tree-node'},
        note: {value: 'jsu-tree-note'},
        expander: {value: 'jsu-tree-expander'},
        label: {value: 'jsu-tree-label'},
        remover: {value: 'jsu-tree-remover'},
        appender: {value: 'jsu-tree-appender'},
        children: {value: 'jsu-tree-children'}
    });

    function Tree($c, autoInit, dev) {
        if (!(this instanceof Tree))
            return new Tree($c, autoInit, dev);
        Object.defineProperty(this, '_key', {value: c.common.uuid()});
        if (!!dev) Tree.logger = null;

        var conf = getConfig(this, $c);
        if (dev) Object.defineProperty(this, '_conf', {value: conf});
        if (autoInit) this.init();
    }

    Tree.prototype.init = function () {
        var conf = getConfig(this);
        replaceWithTemplate(conf);
    };

    Tree.prototype.data = function (data) {
        var conf = getConfig(this);
        if (c.valid.nullOrUndefined(data)) return conf.data.data;
        if (!c.valid.isArray(data)) throw new Error('只接受Array类型');

        conf.views.$tree.html('');
        c.common.each(conf.data.data = data, function (node) {
            var
                key = c.common.uuid(),
                $node = createNode(conf, key, node);
            conf.views.$tree.append($node);
        });
    };

    function createNode(conf, key, node) {
        conf.data.keyMap[key] = node;
        var
            $node = $('<div>', {'data-key': key}).addClass(Tree.style.node),
            $note = $('<div>').addClass(Tree.style.note).appendTo($node),
            $icon = $('<div>').addClass(Tree.style.icon).addClass();
        $note.append($icon);

        var $expander = $('<div>').addClass(Tree.style.expander),
            $selection = $('<div>').addClass(Tree.style.expander);
        $note.append($expander).append($selection);

        var text = c.ognl.getValue(node, conf.prop.label);
        var $title = $('<div>', {html: text}).addClass(Tree.style.label);
        $note.append($title);

        var
            $options = $('<div>').addClass(Tree.style.expander).appendTo($note),
            $editor = $('<div>').addClass(Tree.style.editor),
            $remover = $('<div>').addClass(Tree.style.remover),
            $appender = $('<div>').addClass(Tree.style.appender);
        $options.append($editor).append($remover).append($appender);

        var
            $children = $('<div>').addClass(Tree.style.children).appendTo($node),
            children = c.ognl.getValue(node, conf.prop.children);
        if (c.valid.isArray(children))
            c.common.each(children, function (childrenNode) {
                var
                    key = c.common.uuid(),
                    $node = createNode(conf, key, childrenNode);
                $children.append($node);
            });

        return $node;
    }

    function replaceWithTemplate(conf) {
        conf.views.$bounds = $('<div>').addClass(Tree.style.bounds);
        conf.views.$tree = $('<div>').addClass(Tree.style.tree);
        conf.views.$bounds.append(conf.views.$tree);
        conf.views.$origin.replaceWith(conf.views.$bounds);
    }

    function getConfig(tree, $c) {
        if (Tree.cache[tree.key]) return Tree.cache[tree.key];
        $c = c.valid.isJQuery($c) ? $c : $($c);
        return Tree.cache[tree.key] = {
            _key: tree._key,
            _this: tree,
            _$c: $c,
            views: {
                $origin: $c,
                $bounds: null,
                $tree: null
            },
            data: {
                data: [],
                keyMap: {}
            },
            prop: {
                label: 'label',
                icon: 'icon',
                key: 'key',
                children: 'children',
                expand: 'expand',
                selected: 'selected'
            }
        };
    }

})(window.jsu = (window.jsu || {}));