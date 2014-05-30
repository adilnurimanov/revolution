/**
 * Loads the MODx Ext-driven Layout
 *
 * @class MODx.Layout
 * @extends Ext.Viewport
 * @param {Object} config An object of config options.
 * @xtype modx-layout
 */
Ext.apply(Ext, {
    isFirebug: (window.console && window.console.firebug)
});

MODx.Layout = function(config){
    config = config || {};
    Ext.BLANK_IMAGE_URL = MODx.config.manager_url+'assets/ext3/resources/images/default/s.gif';
    Ext.Ajax.defaultHeaders = {
        'modAuth': config.auth
    };
    Ext.Ajax.extraParams = {
        'HTTP_MODAUTH': config.auth
    };
    MODx.siteId = config.auth;
    MODx.expandHelp = !Ext.isEmpty(MODx.config.inline_help);

    var sp = new MODx.HttpProvider();
    Ext.state.Manager.setProvider(sp);
    sp.initState(MODx.defaultState);

    config.showTree = false;

    Ext.applyIf(config, {
         layout: 'border'
        ,id: 'modx-layout'
        ,saveState: true
        ,items: this.buildLayout(config)
    });
    MODx.Layout.superclass.constructor.call(this,config);
    this.config = config;

    this.addEvents({
        'afterLayout': true
        ,'loadKeyMap': true
        ,'loadTabs': true
    });
    this.loadKeys();
    if (!config.showTree) {
        Ext.getCmp('modx-leftbar-tabs').collapse(false);
        Ext.get('modx-leftbar').hide();
        Ext.get('modx-leftbar-tabs-xcollapsed').setStyle('display','none');
    }
    this.fireEvent('afterLayout');
};
Ext.extend(MODx.Layout, Ext.Viewport, {
    /**
     * Wrapper method to build the layout regions
     *
     * @param {Object} config
     *
     * @returns {Array}
     */
    buildLayout: function(config) {
        var items = []
            ,north = this.getNorth(config)
            ,west = this.getWest(config)
            ,center = this.getCenter(config)
            ,south = this.getSouth(config);

        if (north && Ext.isObject(north)) {
            items.push(north);
        }
        if (west && Ext.isObject(west)) {
            items.push(west);
        }
        if (center && Ext.isObject(center)) {
            items.push(center);
        }
        if (south && Ext.isObject(south)) {
            items.push(south);
        }

        return items;
    }

    /**
     * Build the north region (header)
     *
     * @param {Object} config
     *
     * @returns {Object|void}
     */
    ,getNorth: function(config) {
        return {
            xtype: 'box'
            ,region: 'north'
            ,applyTo: 'modx-header'
            //,height: 55
        };
    }

    /**
     * Build the west region (trees)
     *
     * @param {Object} config
     *
     * @returns {Object|void}
     */
    ,getWest: function(config) {
        var tabs = [];
        if (MODx.perm.resource_tree) {
            tabs.push({
                title: _('resources')
                ,xtype: 'modx-tree-resource'
                ,id: 'modx-resource-tree'
            });
            config.showTree = true;
        }
        if (MODx.perm.element_tree) {
            tabs.push({
                title: _('elements')
                ,xtype: 'modx-tree-element'
                ,id: 'modx-tree-element'
            });
            config.showTree = true;
        }
        if (MODx.perm.file_tree) {
            tabs.push({
                title: _('files')
                ,xtype: 'modx-panel-filetree'
                ,id: 'modx-file-tree'
            });
            config.showTree = true;
        }
        var activeTab = 0;

        return {
            region: 'west'
            ,applyTo: 'modx-leftbar'
            ,id: 'modx-leftbar-tabs'
            ,split: true
            ,width: 310
            ,minSize: 288
            ,maxSize: 800
            ,autoScroll: true
            ,unstyled: true
            ,collapseMode: 'mini'
            ,useSplitTips: true
            ,monitorResize: true
            ,layout: 'anchor'
            ,items: [{
                xtype: 'modx-tabs'
                ,plain: true
                ,defaults: {
                    autoScroll: true
                    ,fitToFrame: true
                }
                ,id: 'modx-leftbar-tabpanel'
                ,border: false
                ,anchor: '100%'
                ,activeTab: activeTab
                ,stateful: true
                ,stateId: 'modx-leftbar-tabs'
                ,stateEvents: ['tabchange']
                ,getState:function() {
                    return {
                        activeTab: this.items.indexOf(this.getActiveTab())
                    };
                }
                ,items: tabs
            }]
            ,listeners:{
                statesave: this.onStatesave
                ,scope: this
            }
        };
    }

    /**
     * Build the center region (main content)
     *
     * @param {Object} config
     *
     * @returns {Object|void}
     */
    ,getCenter: function(config) {
        return {
            region: 'center'
            ,applyTo: 'modx-content'
            ,padding: '0 1px 0 0'
            ,bodyStyle: 'background-color:transparent;'
            ,id: 'modx-content'
            ,border: false
            ,autoScroll: true
        };
    }

    /**
     * Build the south region (footer)
     *
     * @param {Object} config
     *
     * @returns {Object|void}
     */
    ,getSouth: function(config) {

    }


    ,loadKeys: function() {
        Ext.KeyMap.prototype.stopEvent = true;
        var k = new Ext.KeyMap(Ext.get(document));
        k.addBinding({
            key: Ext.EventObject.H
            ,ctrl: true
            ,shift: true
            ,fn: this.toggleLeftbar
            ,scope: this
            ,stopEvent: true
        });
        k.addBinding({
            key: Ext.EventObject.N
            ,ctrl: true
            ,shift: true
            ,fn: function() {
                var t = Ext.getCmp('modx-resource-tree');
                if (t) { t.quickCreate(document,{},'modDocument','web',0); }
            }
            ,stopEvent: true
        });
        k.addBinding({
            key: Ext.EventObject.U
            ,ctrl: true
            ,shift: true
            ,alt: false
            ,fn: MODx.clearCache
            ,scope: this
            ,stopEvent: true
        });

        this.fireEvent('loadKeyMap',{
            keymap: k
        });
    }

    ,refreshTrees: function() {
        var t;
        t = Ext.getCmp('modx-resource-tree'); if (t) { t.refresh(); }
        t = Ext.getCmp('modx-element-tree'); if (t) { t.refresh(); }
        t = Ext.getCmp('modx-file-tree'); if (t) { t.refresh(); }
    }
    ,leftbarVisible: true
    ,toggleLeftbar: function() {
        this.leftbarVisible ? this.hideLeftbar(.3) : this.showLeftbar(.3);
        this.leftbarVisible = !this.leftbarVisible;
    }
    ,hideLeftbar: function(anim, state) {
        Ext.getCmp('modx-leftbar-tabs').collapse(anim);
        if(state != undefined){	this.saveState = state;	}
    }
    ,onStatesave: function(p, state){
        var panelState = state.collapsed;
        if (!panelState) {
            var wrap = Ext.get('modx-leftbar').down('div');
            if (!wrap.isVisible()) {
                // Set the "masking div" to visible
                wrap.setVisible(true);
                Ext.getCmp('modx-leftbar-tabpanel').expand(true);
            }
        }
        if(panelState && !this.saveState){
            Ext.state.Manager.set('modx-leftbar-tabs', {collapsed: false});
            this.saveState = true;
        }
    }
    ,showLeftbar: function(anim) {
        Ext.getCmp('modx-leftbar-tabs').expand(anim);
    }
});

/**
 * Handles layout functions. In module format for easier privitization.
 * @class MODx.LayoutMgr
 */
MODx.LayoutMgr = function() {
    var _activeMenu = 'menu0';
    return {
        loadPage: function(action, parameters) {
            // Handles url, passed as first argument
            var parts = [];
            if (action) {
                if (action.substr(0,1) == '?' || (action.substr(0, "index.php?".length) == 'index.php?')) {
                    parts.push(action);
                } else {
                    parts.push('?a=' + action);
                }
            }
            if (parameters) {
                parts.push(parameters);
            }
            var url = parts.join('&');
            if (MODx.fireEvent('beforeLoadPage', url)) {
                location.href = url;
            }
            return false;
        }
        ,changeMenu: function(a,sm) {
            if (sm === _activeMenu) return false;

            Ext.get(sm).addClass('active');
            var om = Ext.get(_activeMenu);
            if (om) om.removeClass('active');
            _activeMenu = sm;
            return false;
        }
    }
}();

/* aliases for quicker reference */
MODx.loadPage = MODx.LayoutMgr.loadPage;
MODx.showDashboard = MODx.LayoutMgr.showDashboard;
MODx.hideDashboard = MODx.LayoutMgr.hideDashboard;
MODx.changeMenu = MODx.LayoutMgr.changeMenu;
