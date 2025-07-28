// ==UserScript==
// @name         Linux.do 隐藏大标题
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  隐藏 Linux.do 网站滚动时显示的大标题，支持直接隐藏和点击切换两种模式
// @author       You
// @match        https://linux.do/*
// @match        https://*.linux.do/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置选项
    const CONFIG_KEY = 'linuxdo_hide_mode';
    const HIDE_MODE = {
        DIRECT: 'direct',    // 直接隐藏
        CLICK: 'click'       // 点击切换
    };
    
    // 获取当前配置
    let currentMode = GM_getValue(CONFIG_KEY, HIDE_MODE.DIRECT);
    let isHidden = currentMode === HIDE_MODE.DIRECT; // 直接隐藏模式默认隐藏，点击模式默认显示
    
    // 添加基础样式和配置面板样式
    function addBaseStyles() {
        const style = document.createElement('style');
        style.id = 'linuxdo-hide-title-styles';
        style.textContent = `
            /* 配置面板样式 */
            #linuxdo-config-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border: 2px solid #007cbb;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                min-width: 250px;
            }
            
            #linuxdo-config-panel h3 {
                margin: 0 0 10px 0;
                color: #007cbb;
                font-size: 16px;
            }
            
            #linuxdo-config-panel label {
                display: block;
                margin: 8px 0;
                cursor: pointer;
            }
            
            #linuxdo-config-panel input[type="radio"] {
                margin-right: 8px;
            }
            
            #linuxdo-config-panel button {
                background: #007cbb;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                margin: 5px 5px 0 0;
            }
            
            #linuxdo-config-panel button:hover {
                background: #005a8b;
            }
            
            /* 配置按钮样式 */
            #linuxdo-config-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007cbb;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                z-index: 9999;
                font-size: 12px;
            }
            
            #linuxdo-config-btn:hover {
                background: #005a8b;
            }
            
            /* 标题隐藏样式类 */
            .linuxdo-title-hidden .header-title,
            .linuxdo-title-hidden .topic-title,
            .linuxdo-title-hidden .fancy-title,
            .linuxdo-title-hidden .title-wrapper,
            .linuxdo-title-hidden .header-topic-title,
            .linuxdo-title-hidden .header-topic-title-suffix,
            .linuxdo-title-hidden .topic-link[data-topic-id],
            .linuxdo-title-hidden .extra-info-wrapper .topic-link,
            .linuxdo-title-hidden .two-rows .extra-info .topic-link,
            .linuxdo-title-hidden .header .contents .title-wrapper,
            .linuxdo-title-hidden .header .contents .title-wrapper .header-title,
            .linuxdo-title-hidden .d-header .contents .title-wrapper,
            .linuxdo-title-hidden .d-header .contents .title-wrapper .header-title,
            .linuxdo-title-hidden .d-header-wrap .d-header .contents .title-wrapper,
            .linuxdo-title-hidden .d-header-wrap .d-header .contents .title-wrapper .header-title {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
            }
            
            /* 点击模式下的标题区域提示 */
            .linuxdo-click-mode .title-wrapper,
            .linuxdo-click-mode .extra-info-wrapper,
            .linuxdo-click-mode .two-rows {
                cursor: pointer;
                position: relative;
            }
            
            .linuxdo-click-mode .title-wrapper:hover,
            .linuxdo-click-mode .extra-info-wrapper:hover,
            .linuxdo-click-mode .two-rows:hover {
                background-color: rgba(0, 124, 187, 0.1);
            }
        `;
        
        // 将样式添加到head中
        if (document.head) {
            document.head.appendChild(style);
        } else {
            // 如果head还没有加载，等待DOM加载
            document.addEventListener('DOMContentLoaded', function() {
                document.head.appendChild(style);
            });
        }
    }
    
    // 创建配置面板
    function createConfigPanel() {
        const panel = document.createElement('div');
        panel.id = 'linuxdo-config-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <h3>Linux.do 标题隐藏设置</h3>
            <label>
                <input type="radio" name="hideMode" value="${HIDE_MODE.DIRECT}" ${currentMode === HIDE_MODE.DIRECT ? 'checked' : ''}>
                直接隐藏 - 脚本加载后立即隐藏标题
            </label>
            <label>
                <input type="radio" name="hideMode" value="${HIDE_MODE.CLICK}" ${currentMode === HIDE_MODE.CLICK ? 'checked' : ''}>
                点击切换 - 点击标题区域切换显示/隐藏
            </label>
            <div style="margin-top: 15px;">
                <button id="save-config">保存设置</button>
                <button id="close-config">关闭</button>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                当前状态: <span id="current-status">${isHidden ? '已隐藏' : '显示中'}</span>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        panel.querySelector('#save-config').addEventListener('click', function() {
            const selectedMode = panel.querySelector('input[name="hideMode"]:checked').value;
            currentMode = selectedMode;
            GM_setValue(CONFIG_KEY, currentMode);
            
            // 重新应用设置
            applyHideMode();
            panel.style.display = 'none';
            
            // 更新状态显示
            updateStatus();
        });
        
        panel.querySelector('#close-config').addEventListener('click', function() {
            panel.style.display = 'none';
        });
        
        return panel;
    }
    
    // 创建配置按钮
    function createConfigButton() {
        const button = document.createElement('button');
        button.id = 'linuxdo-config-btn';
        button.textContent = '标题设置';
        button.addEventListener('click', function() {
            const panel = document.getElementById('linuxdo-config-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        document.body.appendChild(button);
        return button;
    }
    
    // 更新状态显示
    function updateStatus() {
        const statusElement = document.getElementById('current-status');
        if (statusElement) {
            statusElement.textContent = isHidden ? '已隐藏' : '显示中';
        }
    }
    
    // 应用隐藏模式
    function applyHideMode() {
        const body = document.body;
        
        if (currentMode === HIDE_MODE.DIRECT) {
            // 直接隐藏模式
            isHidden = true;
            body.classList.add('linuxdo-title-hidden');
            body.classList.remove('linuxdo-click-mode');
        } else {
            // 点击切换模式
            isHidden = false; // 默认显示
            body.classList.remove('linuxdo-title-hidden');
            body.classList.add('linuxdo-click-mode');
            
            // 添加点击事件监听
            addClickListeners();
        }
    }
    
    // 添加点击事件监听（用于点击切换模式）
    function addClickListeners() {
        // 移除之前的监听器
        document.removeEventListener('click', handleTitleClick);
        
        // 添加新的监听器
        document.addEventListener('click', handleTitleClick);
    }
    
    // 处理标题点击事件
    function handleTitleClick(event) {
        if (currentMode !== HIDE_MODE.CLICK) return;
        
        // 检查点击的元素是否是标题相关元素
        const clickedElement = event.target;
        const titleContainer = clickedElement.closest('.title-wrapper, .extra-info-wrapper, .two-rows');
        
        if (titleContainer) {
            // 检查是否包含目标文本
            const text = titleContainer.textContent || titleContainer.innerText || '';
            if (text.includes('第七期') || 
                text.includes('整个信息机') || 
                text.includes('真正内容是什么')) {
                
                // 切换隐藏状态
                isHidden = !isHidden;
                
                if (isHidden) {
                    document.body.classList.add('linuxdo-title-hidden');
                } else {
                    document.body.classList.remove('linuxdo-title-hidden');
                }
                
                // 更新状态显示
                updateStatus();
                
                // 阻止事件冒泡
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
    
    // 初始化函数
    function init() {
        // 添加基础样式
        addBaseStyles();
        
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // 创建配置界面
                createConfigPanel();
                createConfigButton();
                
                // 应用当前模式
                applyHideMode();
                
                console.log('Linux.do 标题隐藏脚本已加载，当前模式:', currentMode);
            });
        } else {
            // 页面已加载完成
            createConfigPanel();
            createConfigButton();
            applyHideMode();
            
            console.log('Linux.do 标题隐藏脚本已加载，当前模式:', currentMode);
        }
    }
    
    // 启动脚本
    init();
})();