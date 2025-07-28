// ==UserScript==
// @name         Linux.do 隐藏大标题
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  隐藏 Linux.do 网站滚动时显示的大标题，避免过于醒目
// @author       You
// @match        https://linux.do/*
// @match        https://*.linux.do/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // 添加CSS样式来隐藏标题
    function addHideStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 隐藏主题标题 - 通过多种选择器确保覆盖 */
            .header-title,
            .topic-title,
            .fancy-title,
            .title-wrapper,
            .header-topic-title,
            .header-topic-title-suffix,
            .topic-link[data-topic-id],
            .extra-info-wrapper .topic-link,
            .two-rows .extra-info .topic-link,
            .header .contents .title-wrapper,
            .header .contents .title-wrapper .header-title,
            .d-header .contents .title-wrapper,
            .d-header .contents .title-wrapper .header-title,
            .d-header-wrap .d-header .contents .title-wrapper,
            .d-header-wrap .d-header .contents .title-wrapper .header-title {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
            }
            
            /* 隐藏包含主题标题的整个区域 */
            .extra-info-wrapper:has(.topic-link),
            .two-rows:has(.topic-link),
            .title-wrapper:has(.header-title) {
                display: none !important;
            }
            
            /* 针对特定的标题文本进行隐藏 */
            .topic-link[href*="/t/topic/820825"],
            .header-title:contains("第七期"),
            .header-title:contains("整个信息机"),
            .header-title:contains("真正内容是什么") {
                display: none !important;
            }
            
            /* 隐藏可能包含标题的span元素 */
            span[dir="auto"]:contains("第七期"),
            span[dir="auto"]:contains("整个信息机"),
            span[dir="auto"]:contains("真正内容是什么") {
                display: none !important;
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
    
    // 动态监控和隐藏标题元素
    function hideTitle() {
        // 查找并隐藏所有可能的标题元素
        const selectors = [
            '.header-title',
            '.topic-title', 
            '.fancy-title',
            '.title-wrapper',
            '.header-topic-title',
            '.topic-link[data-topic-id]',
            '.extra-info-wrapper .topic-link',
            '.two-rows .extra-info .topic-link',
            'span[dir="auto"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // 检查元素内容是否包含目标文本
                const text = element.textContent || element.innerText || '';
                if (text.includes('第七期') || 
                    text.includes('整个信息机') || 
                    text.includes('真正内容是什么') ||
                    element.href && element.href.includes('/t/topic/820825')) {
                    
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.style.opacity = '0';
                    element.style.height = '0';
                    element.style.maxHeight = '0';
                    element.style.overflow = 'hidden';
                    
                    // 同时隐藏父元素（如果合适的话）
                    const parent = element.closest('.extra-info-wrapper, .two-rows, .title-wrapper');
                    if (parent) {
                        parent.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // 立即添加样式
    addHideStyles();
    
    // 页面加载完成后执行隐藏
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideTitle);
    } else {
        hideTitle();
    }
    
    // 使用MutationObserver监控DOM变化，处理动态加载的内容
    const observer = new MutationObserver(function(mutations) {
        let shouldHide = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 检查新添加的节点
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent || node.innerText || '';
                        if (text.includes('第七期') || 
                            text.includes('整个信息机') || 
                            text.includes('真正内容是什么')) {
                            shouldHide = true;
                        }
                    }
                });
            }
        });
        
        if (shouldHide) {
            setTimeout(hideTitle, 100); // 延迟执行，确保DOM更新完成
        }
    });
    
    // 开始观察
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
    
    // 定期检查（作为备用方案）
    setInterval(hideTitle, 2000);
    
    console.log('Linux.do 标题隐藏脚本已加载');
})();