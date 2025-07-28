// ==UserScript==
// @name         Linux.do 沉浸式阅读
// @namespace    http://tampermonkey.net/
// @version      1.0
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
            /* 阅读模式切换按钮 */
            #reading-mode-toggle {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
            }
            
            #reading-mode-toggle:hover {
                transform: translateY(-50%) scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            
            #reading-mode-toggle.active {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            
            /* 主题切换按钮 */
            #theme-toggle {
                position: fixed;
                top: calc(50% + 70px);
                right: 20px;
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.9);
                border: 2px solid #ddd;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                backdrop-filter: blur(10px);
            }
            
            #theme-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            /* 阅读模式样式 */
            body.immersive-reading {
                background: var(--reading-bg) !important;
                transition: all 0.5s ease;
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
                border-radius: 12px !important;
                padding: 40px !important;
                margin: 20px 0 !important;
                box-shadow: var(--content-shadow) !important;
                border: var(--content-border) !important;
                transition: all 0.3s ease !important;
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
                --reading-bg: #f8fafc;
                --content-bg: #ffffff;
                --content-shadow: 0 4px 20px rgba(0,0,0,0.08);
                --content-border: 1px solid rgba(0,0,0,0.06);
                --text-color: #2d3748;
                --heading-color: #1a202c;
                --accent-color: #667eea;
                --quote-bg: #f7fafc;
                --code-bg: #f1f5f9;
                --code-color: #e53e3e;
            }
            
            /* 深色主题变量 */
            body.immersive-reading.theme-dark {
                --reading-bg: #0f172a;
                --content-bg: #1e293b;
                --content-shadow: 0 4px 20px rgba(0,0,0,0.3);
                --content-border: 1px solid rgba(255,255,255,0.1);
                --text-color: #e2e8f0;
                --heading-color: #f1f5f9;
                --accent-color: #818cf8;
                --quote-bg: #334155;
                --code-bg: #475569;
                --code-color: #fbbf24;
            }
            
            /* 深色主题按钮样式 */
            body.theme-dark #theme-toggle {
                background: rgba(30,41,59,0.9);
                border-color: #475569;
                color: #e2e8f0;
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
                
                #reading-mode-toggle {
                    right: 15px;
                    width: 45px;
                    height: 45px;
                }
                
                #theme-toggle {
                    right: 15px;
                    width: 35px;
                    height: 35px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 创建切换按钮
    function createToggleButtons() {
        // 阅读模式切换按钮
        const readingToggle = document.createElement('button');
        readingToggle.id = 'reading-mode-toggle';
        readingToggle.innerHTML = '📖';
        readingToggle.title = '切换沉浸式阅读模式';
        
        // 主题切换按钮
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.innerHTML = currentTheme === CONFIG.THEMES.LIGHT ? '🌙' : '☀️';
        themeToggle.title = '切换主题';
        
        document.body.appendChild(readingToggle);
        document.body.appendChild(themeToggle);
        
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
        
        // 创建按钮
        const { readingToggle, themeToggle } = createToggleButtons();
        
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