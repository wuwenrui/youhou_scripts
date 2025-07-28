// ==UserScript==
// @name         Linux.do 沉浸式阅读
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  为 Linux.do 论坛提供优雅的沉浸式阅读体验，专注内容，消除干扰
// @author       You
// @match        https://linux.do/*
// @match        https://*.linux.do/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置选项
    const CONFIG = {
        THEME_KEY: 'linuxdo_reading_theme',
        MODE_KEY: 'linuxdo_reading_mode',
        THEMES: {
            LIGHT: 'light',
            DARK: 'dark'
        }
    };
    
    // 获取保存的设置
    let currentTheme = GM_getValue(CONFIG.THEME_KEY, CONFIG.THEMES.LIGHT);
    let isReadingMode = false;
    
    // 添加基础样式
    function addBaseStyles() {
        const style = document.createElement('style');
        style.id = 'linuxdo-immersive-styles';
        style.textContent = `
            /* 控制面板容器 */
            #reading-control-panel {
                position: fixed;
                top: 50%;
                right: 25px;
                transform: translateY(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            /* 主按钮 - 阅读模式切换 */
            #reading-mode-toggle {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                border: none;
                border-radius: 16px;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 22px;
                position: relative;
                overflow: hidden;
            }
            
            #reading-mode-toggle::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            #reading-mode-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4);
            }
            
            #reading-mode-toggle:hover::before {
                opacity: 1;
            }
            
            #reading-mode-toggle.active {
                background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
                box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
            }
            
            #reading-mode-toggle.active:hover {
                box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4);
            }
            
            /* 次要按钮 - 主题切换 */
            #theme-toggle {
                width: 44px;
                height: 44px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                backdrop-filter: blur(20px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            #theme-toggle:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                background: rgba(255, 255, 255, 1);
            }
            
            /* 阅读模式样式 */
            body.immersive-reading {
                background: var(--reading-bg) !important;
                transition: all 0.5s ease;
                min-height: 100vh;
            }
            
            /* 添加优雅的背景纹理 */
            body.immersive-reading::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(124, 58, 237, 0.05) 0%, transparent 50%);
                pointer-events: none;
                z-index: -1;
            }
            
            /* 隐藏干扰元素 */
            body.immersive-reading .d-header,
            body.immersive-reading #main-outlet > .container > .row > .col:first-child,
            body.immersive-reading .timeline-container,
            body.immersive-reading .topic-navigation,
            body.immersive-reading .suggested-topics,
            body.immersive-reading .more-topics,
            body.immersive-reading .topic-footer-buttons,
            body.immersive-reading .post-controls,
            body.immersive-reading .topic-meta-data,
            body.immersive-reading .names,
            body.immersive-reading .topic-avatar,
            body.immersive-reading .post-info,
            body.immersive-reading .topic-body .actions,
            body.immersive-reading .small-action,
            body.immersive-reading .gap,
            body.immersive-reading .embedded-posts,
            body.immersive-reading .topic-status-info {
                display: none !important;
            }
            
            /* 内容区域优化 */
            body.immersive-reading #main-outlet {
                max-width: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            body.immersive-reading .container {
                max-width: 800px !important;
                margin: 0 auto !important;
                padding: 40px 20px !important;
            }
            
            body.immersive-reading .topic-body {
                background: var(--content-bg) !important;
                border-radius: 20px !important;
                padding: 50px !important;
                margin: 30px 0 !important;
                box-shadow: var(--content-shadow) !important;
                border: var(--content-border) !important;
                transition: all 0.3s ease !important;
                position: relative;
                overflow: hidden;
            }
            
            /* 内容卡片的装饰性元素 */
            body.immersive-reading .topic-body::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, var(--accent-color), transparent);
                opacity: 0.6;
            }
            
            body.immersive-reading .cooked {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                font-size: 16px !important;
                line-height: 1.8 !important;
                color: var(--text-color) !important;
                max-width: none !important;
            }
            
            body.immersive-reading .cooked p {
                margin-bottom: 1.2em !important;
                text-align: justify !important;
            }
            
            body.immersive-reading .cooked h1,
            body.immersive-reading .cooked h2,
            body.immersive-reading .cooked h3,
            body.immersive-reading .cooked h4,
            body.immersive-reading .cooked h5,
            body.immersive-reading .cooked h6 {
                color: var(--heading-color) !important;
                margin: 1.5em 0 0.8em 0 !important;
                font-weight: 600 !important;
            }
            
            body.immersive-reading .cooked blockquote {
                border-left: 4px solid var(--accent-color) !important;
                background: var(--quote-bg) !important;
                padding: 15px 20px !important;
                margin: 1.5em 0 !important;
                border-radius: 6px !important;
            }
            
            body.immersive-reading .cooked code {
                background: var(--code-bg) !important;
                color: var(--code-color) !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
            }
            
            body.immersive-reading .cooked pre {
                background: var(--code-bg) !important;
                border-radius: 8px !important;
                padding: 20px !important;
                overflow-x: auto !important;
                margin: 1.5em 0 !important;
            }
            
            /* 浅色主题变量 */
            body.immersive-reading.theme-light {
                --reading-bg: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                --content-bg: #ffffff;
                --content-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
                --content-border: 1px solid rgba(0,0,0,0.04);
                --text-color: #374151;
                --heading-color: #111827;
                --accent-color: #4f46e5;
                --quote-bg: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                --code-bg: #f8fafc;
                --code-color: #dc2626;
            }
            
            /* 深色主题变量 */
            body.immersive-reading.theme-dark {
                --reading-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                --content-bg: #1e293b;
                --content-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
                --content-border: 1px solid rgba(255,255,255,0.08);
                --text-color: #e2e8f0;
                --heading-color: #f8fafc;
                --accent-color: #6366f1;
                --quote-bg: linear-gradient(135deg, #334155 0%, #475569 100%);
                --code-bg: #334155;
                --code-color: #fbbf24;
            }
            
            /* 深色主题按钮样式 */
            body.theme-dark #theme-toggle {
                background: rgba(30, 41, 59, 0.95);
                border-color: rgba(255, 255, 255, 0.1);
                color: #e2e8f0;
            }
            
            body.theme-dark #theme-toggle:hover {
                background: rgba(30, 41, 59, 1);
                border-color: rgba(255, 255, 255, 0.2);
            }
            
            /* 平滑过渡动画 */
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                body.immersive-reading .container {
                    padding: 20px 15px !important;
                }
                
                body.immersive-reading .topic-body {
                    padding: 25px !important;
                    margin: 15px 0 !important;
                }
                
                #reading-control-panel {
                    right: 15px;
                    gap: 10px;
                }
                
                #reading-mode-toggle {
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }
                
                #theme-toggle {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
            }
            
            /* 工具提示样式 */
            .reading-tooltip {
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 10001;
            }
            
            .reading-tooltip::after {
                content: '';
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                border: 5px solid transparent;
                border-left-color: rgba(0, 0, 0, 0.8);
            }
            
            #reading-mode-toggle:hover .reading-tooltip,
            #theme-toggle:hover .reading-tooltip {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 创建控制面板
    function createControlPanel() {
        // 创建面板容器
        const panel = document.createElement('div');
        panel.id = 'reading-control-panel';
        
        // 阅读模式切换按钮
        const readingToggle = document.createElement('button');
        readingToggle.id = 'reading-mode-toggle';
        readingToggle.innerHTML = '📖';
        
        // 添加工具提示
        const readingTooltip = document.createElement('div');
        readingTooltip.className = 'reading-tooltip';
        readingTooltip.textContent = '沉浸式阅读 (Alt+R)';
        readingToggle.appendChild(readingTooltip);
        
        // 主题切换按钮
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.innerHTML = currentTheme === CONFIG.THEMES.LIGHT ? '🌙' : '☀️';
        
        // 添加工具提示
        const themeTooltip = document.createElement('div');
        themeTooltip.className = 'reading-tooltip';
        themeTooltip.textContent = '切换主题 (Alt+T)';
        themeToggle.appendChild(themeTooltip);
        
        // 组装面板
        panel.appendChild(readingToggle);
        panel.appendChild(themeToggle);
        document.body.appendChild(panel);
        
        return { readingToggle, themeToggle };
    }
    
    // 切换阅读模式
    function toggleReadingMode() {
        isReadingMode = !isReadingMode;
        const body = document.body;
        const toggle = document.getElementById('reading-mode-toggle');
        
        if (isReadingMode) {
            body.classList.add('immersive-reading');
            body.classList.add(`theme-${currentTheme}`);
            toggle.classList.add('active');
            toggle.innerHTML = '📚';
            
            // 滚动到内容区域
            setTimeout(() => {
                const content = document.querySelector('.topic-body');
                if (content) {
                    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        } else {
            body.classList.remove('immersive-reading');
            body.classList.remove(`theme-${currentTheme}`);
            toggle.classList.remove('active');
            toggle.innerHTML = '📖';
        }
    }
    
    // 切换主题
    function toggleTheme() {
        currentTheme = currentTheme === CONFIG.THEMES.LIGHT ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
        GM_setValue(CONFIG.THEME_KEY, currentTheme);
        
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');
        
        // 更新主题类
        if (isReadingMode) {
            body.classList.remove('theme-light', 'theme-dark');
            body.classList.add(`theme-${currentTheme}`);
        }
        
        // 更新按钮图标
        themeToggle.innerHTML = currentTheme === CONFIG.THEMES.LIGHT ? '🌙' : '☀️';
    }
    
    // 初始化
    function init() {
        // 只在帖子页面启用
        if (!window.location.pathname.includes('/t/')) {
            return;
        }
        
        // 添加样式
        addBaseStyles();
        
        // 创建控制面板
        const { readingToggle, themeToggle } = createControlPanel();
        
        // 绑定事件
        readingToggle.addEventListener('click', toggleReadingMode);
        themeToggle.addEventListener('click', toggleTheme);
        
        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            // Alt + R 切换阅读模式
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                toggleReadingMode();
            }
            // Alt + T 切换主题
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                toggleTheme();
            }
        });
        
        console.log('Linux.do 沉浸式阅读脚本已加载');
        console.log('快捷键: Alt+R 切换阅读模式, Alt+T 切换主题');
    }
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();