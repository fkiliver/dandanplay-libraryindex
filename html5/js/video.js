// 弹幕外观设置管理
(function() {
    'use strict';
    
    // 默认弹幕设置
    const defaultDanmakuSettings = {
        fontSize: 25,
        fontFamily: 'SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif',
        speed: 10, // 持续时间（秒）
        opacity: 1.0,
        textStrokeWidth: 0.5,
        textStrokeColor: '#000000',
        textShadowX: 1.0,
        textShadowY: 1.0,
        textShadowBlur: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        bold: false,
        displayArea: 100 // 显示区域百分比，默认100%全屏
    };
    
    // 从localStorage加载设置
    function loadDanmakuSettings() {
        const savedSettings = localStorage.getItem('danmakuSettings');
        if (savedSettings) {
            try {
                return Object.assign({}, defaultDanmakuSettings, JSON.parse(savedSettings));
            } catch (e) {
                console.error('Failed to load danmaku settings:', e);
            }
        }
        return Object.assign({}, defaultDanmakuSettings);
    }
    
    // 保存设置到localStorage
    function saveDanmakuSettings(settings) {
        try {
            localStorage.setItem('danmakuSettings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save danmaku settings:', e);
        }
    }
    
    // 应用弹幕样式
    function applyDanmakuStyles(settings) {
        // 移除旧的样式
        const oldStyle = document.getElementById('dynamic-danmaku-style');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // 创建新样式
        const style = document.createElement('style');
        style.id = 'dynamic-danmaku-style';
        
        const fontWeight = settings.bold ? 'bold' : 'normal';
        
        style.textContent = `
            .dplayer-danmaku {
                font-size: ${settings.fontSize}px !important;
                font-family: ${settings.fontFamily} !important;
                height: ${settings.displayArea}% !important;
            }
            
            .dplayer-danmaku .dplayer-danmaku-item {
                font-weight: ${fontWeight} !important;
                opacity: ${settings.opacity} !important;
                -webkit-text-stroke: ${settings.textStrokeWidth}px ${settings.textStrokeColor} !important;
                text-stroke: ${settings.textStrokeWidth}px ${settings.textStrokeColor} !important;
                text-shadow: ${settings.textShadowX}px ${settings.textShadowY}px ${settings.textShadowBlur}px ${settings.textShadowColor} !important;
            }
            
            .dplayer-danmaku .dplayer-danmaku-right.dplayer-danmaku-move {
                -webkit-animation: danmaku ${settings.speed}s linear !important;
                animation: danmaku ${settings.speed}s linear !important;
            }
            
            /* Mobile styles */
            .dplayer-mobile .dplayer-danmaku {
                font-size: ${Math.max(settings.fontSize - 5, 16)}px !important;
            }
            
            .dplayer.dplayer-arrow.dplayer-mobile .dplayer-danmaku {
                font-size: ${Math.max(settings.fontSize - 5, 16)}px !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 初始化弹幕设置
    function initDanmakuSettings() {
        const settings = loadDanmakuSettings();
        applyDanmakuStyles(settings);
    }
    
    // 打开弹幕设置弹窗
    window.openDanmakuSettingsModal = function() {
        const modal = document.getElementById('danmakuSettingsModal');
        if (modal) {
            modal.style.display = 'block';
            // 加载当前设置到表单
            const settings = loadDanmakuSettings();
            document.getElementById('danmakuFontSize').value = settings.fontSize;
            document.getElementById('danmakuFontSizeValue').textContent = settings.fontSize;
            document.getElementById('danmakuFontFamily').value = settings.fontFamily;
            document.getElementById('danmakuSpeed').value = settings.speed;
            document.getElementById('danmakuSpeedValue').textContent = settings.speed;
            document.getElementById('danmakuOpacity').value = settings.opacity;
            document.getElementById('danmakuOpacityValue').textContent = Math.round(settings.opacity * 100);
            document.getElementById('danmakuTextStrokeWidth').value = settings.textStrokeWidth;
            document.getElementById('danmakuTextStrokeWidthValue').textContent = settings.textStrokeWidth;
            document.getElementById('danmakuTextStrokeColor').value = settings.textStrokeColor;
            document.getElementById('danmakuTextShadowX').value = settings.textShadowX;
            document.getElementById('danmakuTextShadowXValue').textContent = settings.textShadowX;
            document.getElementById('danmakuTextShadowY').value = settings.textShadowY;
            document.getElementById('danmakuTextShadowYValue').textContent = settings.textShadowY;
            document.getElementById('danmakuTextShadowBlur').value = settings.textShadowBlur;
            document.getElementById('danmakuTextShadowBlurValue').textContent = settings.textShadowBlur;
            document.getElementById('danmakuBold').checked = settings.bold;
            document.getElementById('danmakuDisplayArea').value = settings.displayArea;
            document.getElementById('danmakuDisplayAreaValue').textContent = settings.displayArea;
        }
    };
    
    // 关闭弹幕设置弹窗
    window.closeDanmakuSettingsModal = function() {
        const modal = document.getElementById('danmakuSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // 保存弹幕设置（废弃，改为实时保存）
    window.saveDanmakuSettings = function() {
        // 实时保存已经在 updateDanmakuPreview 中完成，这里只需关闭弹窗
        closeDanmakuSettingsModal();
    };
    
    // 重置为默认设置
    window.resetDanmakuSettings = function() {
        // 直接重置，不需要确认
        localStorage.removeItem('danmakuSettings');
        applyDanmakuStyles(defaultDanmakuSettings);
        
        // 更新表单显示为默认值
        document.getElementById('danmakuFontSize').value = defaultDanmakuSettings.fontSize;
        document.getElementById('danmakuFontSizeValue').textContent = defaultDanmakuSettings.fontSize;
        document.getElementById('danmakuFontFamily').value = defaultDanmakuSettings.fontFamily;
        document.getElementById('danmakuSpeed').value = defaultDanmakuSettings.speed;
        document.getElementById('danmakuSpeedValue').textContent = defaultDanmakuSettings.speed;
        document.getElementById('danmakuOpacity').value = defaultDanmakuSettings.opacity;
        document.getElementById('danmakuOpacityValue').textContent = Math.round(defaultDanmakuSettings.opacity * 100);
        document.getElementById('danmakuTextStrokeWidth').value = defaultDanmakuSettings.textStrokeWidth;
        document.getElementById('danmakuTextStrokeWidthValue').textContent = defaultDanmakuSettings.textStrokeWidth;
        document.getElementById('danmakuTextStrokeColor').value = defaultDanmakuSettings.textStrokeColor;
        document.getElementById('danmakuTextShadowX').value = defaultDanmakuSettings.textShadowX;
        document.getElementById('danmakuTextShadowXValue').textContent = defaultDanmakuSettings.textShadowX;
        document.getElementById('danmakuTextShadowY').value = defaultDanmakuSettings.textShadowY;
        document.getElementById('danmakuTextShadowYValue').textContent = defaultDanmakuSettings.textShadowY;
        document.getElementById('danmakuTextShadowBlur').value = defaultDanmakuSettings.textShadowBlur;
        document.getElementById('danmakuTextShadowBlurValue').textContent = defaultDanmakuSettings.textShadowBlur;
        document.getElementById('danmakuBold').checked = defaultDanmakuSettings.bold;
        document.getElementById('danmakuDisplayArea').value = defaultDanmakuSettings.displayArea;
        document.getElementById('danmakuDisplayAreaValue').textContent = defaultDanmakuSettings.displayArea;
        
        // 不关闭弹窗，让用户看到重置后的效果
    };
    
    // 实时预览并保存
    window.updateDanmakuPreview = function(settingName, value) {
        const settings = loadDanmakuSettings();
        
        switch(settingName) {
            case 'fontSize':
                document.getElementById('danmakuFontSizeValue').textContent = value;
                settings.fontSize = parseInt(value);
                break;
            case 'speed':
                document.getElementById('danmakuSpeedValue').textContent = value;
                settings.speed = parseFloat(value);
                break;
            case 'opacity':
                document.getElementById('danmakuOpacityValue').textContent = Math.round(value * 100);
                settings.opacity = parseFloat(value);
                settings.textShadowColor = `rgba(0, 0, 0, ${parseFloat(value)})`;
                break;
            case 'textStrokeWidth':
                document.getElementById('danmakuTextStrokeWidthValue').textContent = value;
                settings.textStrokeWidth = parseFloat(value);
                break;
            case 'textShadowX':
                document.getElementById('danmakuTextShadowXValue').textContent = value;
                settings.textShadowX = parseFloat(value);
                break;
            case 'textShadowY':
                document.getElementById('danmakuTextShadowYValue').textContent = value;
                settings.textShadowY = parseFloat(value);
                break;
            case 'textShadowBlur':
                document.getElementById('danmakuTextShadowBlurValue').textContent = value;
                settings.textShadowBlur = parseFloat(value);
                break;
            case 'displayArea':
                document.getElementById('danmakuDisplayAreaValue').textContent = value;
                settings.displayArea = parseInt(value);
                break;
            case 'fontFamily':
                settings.fontFamily = value;
                break;
            case 'textStrokeColor':
                settings.textStrokeColor = value;
                break;
            case 'bold':
                settings.bold = value;
                break;
        }
        
        // 实时保存到 localStorage
        saveDanmakuSettings(settings);
        // 实时应用样式
        applyDanmakuStyles(settings);
    };
    
    // 页面加载时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDanmakuSettings);
    } else {
        initDanmakuSettings();
    }
})();

