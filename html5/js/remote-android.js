// 安卓版遥控器
$(document).ready(function () {
    var isConnected = false;
    var isPlaying = false;
    var currentVolume = 50;
    var currentSpeed = 1.0;
    var currentBrightness = 50;
    var currentTime = 0;
    var duration = 0;
    var isSeeking = false;
    var updateInterval = null;
    var progressInterval = null;
    var lastUpdateTime = 0;
    var serverBaseUrl = '';

    // 本地缓存最后应用的弹幕设置
    var lastDanmuSettings = {};

    // 格式化时间
    function formatTime(seconds) {
        if (!seconds || seconds <= 0) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    // 显示加载状态
    function showLoading() {
        $('#loadingOverlay').addClass('show');
    }

    function hideLoading() {
        $('#loadingOverlay').removeClass('show');
    }

    // 更新连接状态UI
    function updateConnectionStatus(status) {
        var statusElem = $('#connectionStatus');
        var statusText = $('#statusText');
        var connectBtn = $('#connectBtn');
        
        statusElem.removeClass('status-disconnected status-connecting status-connected');
        
        switch(status) {
            case 'connecting':
                statusElem.addClass('status-connecting');
                statusText.text('连接中...');
                connectBtn.prop('disabled', true);
                break;
            case 'connected':
                isConnected = true;
                statusElem.addClass('status-connected');
                statusText.text('已连接');
                connectBtn.html('<i class="fas fa-plug"></i> 断开连接');
                connectBtn.removeClass('btn-primary').addClass('btn-danger');
                connectBtn.prop('disabled', false);
                enableControls();
                break;
            case 'disconnected':
                isConnected = false;
                statusElem.addClass('status-disconnected');
                statusText.text('未连接');
                connectBtn.html('<i class="fas fa-plug"></i> 连接');
                connectBtn.addClass('btn-primary').removeClass('btn-danger');
                connectBtn.prop('disabled', false);
                disableControls();
                break;
        }
    }

    // 启用控制按钮
    function enableControls() {
        $('#playPauseBtn, #stopBtn').prop('disabled', false);
        $('#volumeSlider, #muteBtn').prop('disabled', false);
        $('.seek-controls button').prop('disabled', false);
        $('.speed-controls button').prop('disabled', false);
        $('#brightnessSlider, #brightnessUpBtn, #brightnessDownBtn').prop('disabled', false);
        $('#danmuSize, #danmuSpeed, #danmuAlpha, #danmuStoke').prop('disabled', false);
        $('#showMobileDanmu, #showBottomDanmu, #showTopDanmu').prop('disabled', false);
        $('#danmuMaxCount, #danmuMaxLine, #cloudDanmuBlock, #danmuLanguage').prop('disabled', false);
    }

    // 禁用控制按钮
    function disableControls() {
        $('#playPauseBtn, #stopBtn').prop('disabled', true);
        $('#volumeSlider, #muteBtn').prop('disabled', true);
        $('.seek-controls button').prop('disabled', true);
        $('.speed-controls button').prop('disabled', true);
        $('#brightnessSlider, #brightnessUpBtn, #brightnessDownBtn').prop('disabled', true);
        $('#danmuSize, #danmuSpeed, #danmuAlpha, #danmuStoke').prop('disabled', true);
        $('#showMobileDanmu, #showBottomDanmu, #showTopDanmu').prop('disabled', true);
        $('#danmuMaxCount, #danmuMaxLine, #cloudDanmuBlock, #danmuLanguage').prop('disabled', true);
    }

    // 更新进度显示
    function updateProgress() {
        if (duration > 0) {
            var percentage = (currentTime / duration) * 100;
            $('#progressFill').css('width', percentage + '%');
        }
        $('#currentTime').text(formatTime(currentTime));
        $('#duration').text(formatTime(duration));
    }

    // 更新播放状态UI
    function updatePlayStatus(playing) {
        isPlaying = playing;
        if (playing) {
            $('#playPauseBtn').html('<i class="fas fa-pause"></i>');
            $('#playerStatus').removeClass('status-paused status-stopped').addClass('status-playing')
                .html('<i class="fas fa-play"></i> 播放中');
            
            // 启动本地进度更新
            if (!progressInterval) {
                lastUpdateTime = Date.now();
                progressInterval = setInterval(function() {
                    if (isPlaying && duration > 0) {
                        var now = Date.now();
                        var elapsed = (now - lastUpdateTime) / 1000;
                        lastUpdateTime = now;
                        currentTime = Math.min(currentTime + elapsed, duration);
                        updateProgress();
                    }
                }, 1000);
            }
        } else {
            $('#playPauseBtn').html('<i class="fas fa-play"></i>');
            $('#playerStatus').removeClass('status-playing').addClass('status-paused')
                .html('<i class="fas fa-pause"></i> 已暂停');
            
            // 停止本地进度更新
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }
    }

    // 连接到服务器
    function connectToServer() {
        var ip = $('#serverIp').val().trim();
        var port = $('#serverPort').val().trim();
        
        if (!ip || !port) {
            var errMsg = '请输入IP地址和端口号';
            console.error('[connectToServer] 输入验证失败:', errMsg);
            alert(errMsg);
            return;
        }
        
        // 不论连接是否成功，都保存配置
        saveConfig(ip, port);
        console.log('[connectToServer] 保存配置 - IP:', ip, 'Port:', port);
        
        serverBaseUrl = 'http://' + ip + ':' + port;
        console.log('[connectToServer] 开始连接到服务器:', serverBaseUrl);
        
        updateConnectionStatus('connecting');
        showLoading();
        
        $.ajax({
            url: serverBaseUrl + '/init',
            method: 'GET',
            headers: {
                'screencast-version': '1'
            },
            timeout: 5000,
            success: function (data) {
                hideLoading();
                console.log('[connectToServer] 收到服务器响应:', data);
                console.log('[connectToServer] 响应数据类型:', typeof data);
                
                // 确保 data 是对象，如果是字符串则解析
                var responseData = data;
                if (typeof data === 'string') {
                    try {
                        responseData = JSON.parse(data);
                        console.log('[connectToServer] 已解析JSON:', responseData);
                    } catch (e) {
                        console.error('[connectToServer] JSON解析失败:', e);
                        responseData = data;
                    }
                }
                
                if (responseData.success || responseData.errorCode === 200) {
                    console.log('[connectToServer] 连接成功');
                    updateConnectionStatus('connected');
                    fetchCurrentStatus();
                    // 连接成功后启动定期更新
                    if (!updateInterval) {
                        updateInterval = setInterval(fetchCurrentStatus, 2000);
                    }
                } else {
                    var errMsg = '连接失败: ' + (responseData.errorMessage || '未知错误');
                    console.error('[connectToServer] 连接失败:', responseData);
                    updateConnectionStatus('disconnected');
                    alert(errMsg);
                }
            },
            error: function (xhr, status, error) {
                hideLoading();
                var errMsg = '无法连接到服务器 (' + ip + ':' + port + '): ' + error;
                console.error('[connectToServer] 网络错误:', {
                    status: status,
                    error: error,
                    xhr: xhr,
                    statusCode: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
                updateConnectionStatus('disconnected');
                alert(errMsg);
            }
        });
    }

    // 断开连接
    function disconnect() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        updateConnectionStatus('disconnected');
        $('#mediaTitle').text('未连接到设备');
        $('#mediaSubtitle').html('&nbsp;');
        currentTime = 0;
        duration = 0;
        updateProgress();
    }

    // 获取当前播放状态
    function fetchCurrentStatus() {
        if (!isConnected) return;
        
        $.ajax({
            url: serverBaseUrl + '/remote/control',
            method: 'GET',
            headers: {
                'screencast-version': '1'
            },
            timeout: 3000,
            success: function (data) {
                console.log('[fetchCurrentStatus] 收到播放状态:', data);
                
                // 确保 data 是对象，如果是字符串则解析
                var responseData = data;
                if (typeof data === 'string') {
                    try {
                        responseData = JSON.parse(data);
                        console.log('[fetchCurrentStatus] 已解析JSON:', responseData);
                    } catch (e) {
                        console.error('[fetchCurrentStatus] JSON解析失败:', e);
                        responseData = data;
                    }
                }
                
                if (responseData.success && responseData.status) {
                    var status = responseData.status;
                    
                    // 更新播放信息
                    $('#mediaTitle').text(status.title || '未知标题');
                    $('#mediaSubtitle').html('&nbsp;');
                    
                    // position和duration都是毫秒
                    duration = (status.duration || 0) / 1000;
                    currentTime = (status.position || 0) / 1000;
                    
                    if (typeof status.volumePercent !== 'undefined') {
                        currentVolume = status.volumePercent;
                    } else {
                        currentVolume = 50;
                    }
                    
                    if (typeof status.speed !== 'undefined') {
                        currentSpeed = status.speed;
                    } else {
                        currentSpeed = 1.0;
                    }
                    
                    if (typeof status.brightnessPercent !== 'undefined') {
                        currentBrightness = status.brightnessPercent;
                    } else {
                        currentBrightness = 50;
                    }
                    
                    lastUpdateTime = Date.now();
                    updateProgress();
                    updatePlayStatus(status.playing || false);
                    
                    $('#volumeSlider').val(currentVolume);
                    $('#volumeValue').text(currentVolume + '%');
                    updateVolumeIcon();
                    
                    $('#speedValue').text(currentSpeed.toFixed(2) + 'x');
                    updateSpeedButtons();
                    
                    $('#brightnessSlider').val(currentBrightness);
                    $('#brightnessValue').text(currentBrightness + '%');
                } else if (!responseData.success && responseData.errorCode && responseData.errorMessage) {
                    // 连接成功但出现业务错误（如播放器未运行），显示错误信息但不断开连接
                    console.warn('[fetchCurrentStatus] 业务错误，代码:', responseData.errorCode, '消息:', responseData.errorMessage);
                    $('#mediaTitle').text(responseData.errorMessage);
                    $('#mediaSubtitle').html('&nbsp;');
                    currentTime = 0;
                    duration = 0;
                    updateProgress();
                    updatePlayStatus(false);
                } else {
                    // 未知错误
                    var errMsg = '获取播放器状态失败';
                    console.error('[fetchCurrentStatus] 获取状态失败:', responseData);
                    updateConnectionStatus('disconnected');
                    // 注意：这里不断开连接导致轮询停止，改为只记录警告
                    // alert(errMsg);
                }
            },
            error: function (xhr, status, error) {
                console.error('[fetchCurrentStatus] 网络错误:', {
                    status: status,
                    error: error,
                    xhr: xhr,
                    statusCode: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
                // 网络错误时才断开连接
                updateConnectionStatus('disconnected');
            }
        });
    }

    // 发送控制命令
    function sendControlCommand(action, params) {
        if (!isConnected) return;
        
        showLoading();
        
        var data = { action: action };
        if (params) {
            $.extend(data, params);
        }
        
        console.log('[sendControlCommand] 发送命令:', data);
        
        $.ajax({
            url: serverBaseUrl + '/remote/control',
            method: 'POST',
            headers: {
                'screencast-version': '1'
            },
            contentType: 'application/json',
            data: JSON.stringify(data),
            timeout: 3000,
            success: function (response) {
                hideLoading();
                console.log('[sendControlCommand] 命令响应:', response);
                
                // 确保 response 是对象，如果是字符串则解析
                var responseData = response;
                if (typeof response === 'string') {
                    try {
                        responseData = JSON.parse(response);
                        console.log('[sendControlCommand] 已解析JSON:', responseData);
                    } catch (e) {
                        console.error('[sendControlCommand] JSON解析失败:', e);
                        responseData = response;
                    }
                }
                
                if (responseData.success) {
                    console.log('[sendControlCommand] 命令执行成功');
                    setTimeout(fetchCurrentStatus, 300);
                } else if (responseData.errorCode && responseData.errorMessage) {
                    // 业务错误，提示但不断开连接
                    var errMsg = responseData.errorMessage;
                    console.warn('[sendControlCommand] 命令执行失败 - 错误码:', responseData.errorCode, '消息:', errMsg);
                    alert(errMsg);
                } else {
                    // 未知错误
                    var errMsg = '控制命令失败: ' + (responseData.errorMessage || '未知错误');
                    console.error('[sendControlCommand] 命令执行失败:', responseData);
                    alert(errMsg);
                }
            },
            error: function (xhr, status, error) {
                hideLoading();
                var errMsg = '控制命令发送失败';
                console.error('[sendControlCommand] 网络错误:', {
                    action: action,
                    status: status,
                    error: error,
                    xhr: xhr,
                    statusCode: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
                alert(errMsg);
            }
        });
    }

    // 跳转到指定位置
    function seekTo(offsetSeconds) {
        if (duration <= 0) return;
        
        var newTime = currentTime + offsetSeconds;
        newTime = Math.max(0, Math.min(duration, newTime));
        
        // 转换为毫秒
        var timeMs = Math.floor(newTime * 1000);
        
        sendControlCommand('seekBy', { offset: offsetSeconds * 1000 });
    }

    // 更新音量图标
    function updateVolumeIcon() {
        var icon = $('#muteBtn i');
        if (currentVolume == 0) {
            icon.removeClass().addClass('fas fa-volume-mute');
        } else if (currentVolume < 50) {
            icon.removeClass().addClass('fas fa-volume-down');
        } else {
            icon.removeClass().addClass('fas fa-volume-up');
        }
    }

    // 更新播放速度按钮状态
    function updateSpeedButtons() {
        $('.speed-controls button').removeClass('active');
        var speedValue = parseFloat(currentSpeed).toFixed(2);
        $('.speed-controls button[data-speed="' + speedValue + '"]').addClass('active');
    }

    // 应用单个弹幕设置参数
    function applyDanmuSetting(paramName, paramValue) {
        if (!isConnected) {
            console.log('[applyDanmuSetting] 未连接到服务器');
            return;
        }
        
        // 保存到 localStorage
        var allSettings = getDanmuSettingsFromUI();
        saveDanmuSettings(allSettings);
        
        console.log('[applyDanmuSetting] 发送弹幕设置:', paramName, '=', paramValue);
        
        var queryString = encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
        
        $.ajax({
            url: serverBaseUrl + '/remote/config?' + queryString,
            method: 'GET',
            headers: {
                'screencast-version': '1'
            },
            timeout: 3000,
            success: function (data) {
                console.log('[applyDanmuSetting] 设置响应:', data);
                
                // 确保 data 是对象，如果是字符串则解析
                var responseData = data;
                if (typeof data === 'string') {
                    try {
                        responseData = JSON.parse(data);
                        console.log('[applyDanmuSetting] 已解析JSON:', responseData);
                    } catch (e) {
                        console.error('[applyDanmuSetting] JSON解析失败:', e);
                        responseData = data;
                    }
                }
                
                if (responseData.success) {
                    console.log('[applyDanmuSetting] 设置成功');
                } else if (responseData.errorCode && responseData.errorMessage) {
                    console.warn('[applyDanmuSetting] 设置失败 - 错误码:', responseData.errorCode, '消息:', responseData.errorMessage);
                } else {
                    console.error('[applyDanmuSetting] 设置失败:', responseData);
                }
            },
            error: function (xhr, status, error) {
                console.error('[applyDanmuSetting] 网络错误:', {
                    status: status,
                    error: error,
                    paramName: paramName,
                    paramValue: paramValue
                });
            }
        });
    }

    // 从UI获取所有弹幕设置
    function getDanmuSettingsFromUI() {
        return {
            'danmuSize': parseInt($('#danmuSize').val()),
            'danmuSpeed': parseInt($('#danmuSpeed').val()),
            'danmuAlpha': parseInt($('#danmuAlpha').val()),
            'danmuStoke': parseInt($('#danmuStoke').val()),
            'showMobileDanmu': $('#showMobileDanmu').is(':checked'),
            'showBottomDanmu': $('#showBottomDanmu').is(':checked'),
            'showTopDanmu': $('#showTopDanmu').is(':checked'),
            'danmuMaxCount': parseInt($('#danmuMaxCount').val() || 0),
            'danmuMaxLine': parseInt($('#danmuMaxLine').val() || -1),
            'cloudDanmuBlock': $('#cloudDanmuBlock').is(':checked'),
            'danmuLanguage': parseInt($('#danmuLanguage').val())
        };
    }

    // 保存弹幕设置到 localStorage
    function saveDanmuSettings(settings) {
        localStorage.setItem('remoteAndroidDanmuSettings', JSON.stringify(settings));
        console.log('[saveDanmuSettings] 已保存弹幕设置');
    }

    // 从 localStorage 加载弹幕设置
    function loadDanmuSettings() {
        var saved = localStorage.getItem('remoteAndroidDanmuSettings');
        if (saved) {
            try {
                var settings = JSON.parse(saved);
                console.log('[loadDanmuSettings] 已加载弹幕设置:', settings);
                
                // 恢复到UI
                $('#danmuSize').val(settings.danmuSize || 40);
                $('#danmuSizeValue').text(settings.danmuSize || 40);
                
                $('#danmuSpeed').val(settings.danmuSpeed || 35);
                $('#danmuSpeedValue').text(settings.danmuSpeed || 35);
                
                $('#danmuAlpha').val(settings.danmuAlpha || 100);
                $('#danmuAlphaValue').text(settings.danmuAlpha || 100);
                
                $('#danmuStoke').val(settings.danmuStoke || 20);
                $('#danmuStokeValue').text(settings.danmuStoke || 20);
                
                $('#showMobileDanmu').prop('checked', settings.showMobileDanmu !== false);
                $('#showBottomDanmu').prop('checked', settings.showBottomDanmu !== false);
                $('#showTopDanmu').prop('checked', settings.showTopDanmu !== false);
                
                $('#danmuMaxCount').val(settings.danmuMaxCount || 0);
                $('#danmuMaxCountValue').text(settings.danmuMaxCount === 0 ? '无限制' : settings.danmuMaxCount);
                
                $('#danmuMaxLine').val(settings.danmuMaxLine || -1);
                $('#danmuMaxLineValue').text(settings.danmuMaxLine === -1 ? '无限制' : settings.danmuMaxLine);
                
                $('#cloudDanmuBlock').prop('checked', settings.cloudDanmuBlock !== false);
                
                $('#danmuLanguage').val(settings.danmuLanguage || 0);
            } catch (e) {
                console.error('[loadDanmuSettings] 加载失败:', e);
            }
        }
    }

    // ===== 事件绑定 =====

    // 连接按钮点击
    $('#connectBtn').click(function () {
        if (isConnected) {
            disconnect();
            updateConnectionStatus('disconnected');
            $(this).html('<i class="fas fa-plug"></i> 连接');
            $(this).addClass('btn-primary').removeClass('btn-danger');
        } else {
            connectToServer();
            // 连接中状态下改变按钮外观
            if (!isConnected) {
                $(this).html('<i class="fas fa-circle-notch fa-spin"></i> 连接中...');
                $(this).prop('disabled', true);
            }
        }
    });

    // 播放/暂停
    $('#playPauseBtn').click(function () {
        if (isPlaying) {
            sendControlCommand('pause');
        } else {
            sendControlCommand('play');
        }
    });

    // 停止
    $('#stopBtn').click(function () {
        sendControlCommand('exit');
    });

    // 快速定位按钮
    $('.seek-controls button').click(function () {
        var offset = parseInt($(this).data('seek'));
        seekTo(offset);
    });

    // 播放速度预设按钮
    $('.speed-controls button').click(function () {
        var speed = parseFloat($(this).data('speed'));
        if (speed > 0 && isConnected) {
            sendControlCommand('speed', { speed: speed });
        }
    });

    // 亮度滑块
    var brightnessTimeout = null;
    $('#brightnessSlider').on('input', function () {
        var brightness = parseInt($(this).val());
        currentBrightness = brightness;
        $('#brightnessValue').text(brightness + '%');
        
        // 防抖：延迟发送API请求
        clearTimeout(brightnessTimeout);
        brightnessTimeout = setTimeout(function () {
            sendControlCommand('brightness', { percent: brightness });
        }, 300);
    });

    // 亮度增加按钮
    $('#brightnessUpBtn').click(function () {
        if (isConnected) {
            sendControlCommand('brightnessUp', { delta: 5 });
        }
    });

    // 亮度降低按钮
    $('#brightnessDownBtn').click(function () {
        if (isConnected) {
            sendControlCommand('brightnessDown', { delta: 5 });
        }
    });

    // 进度条点击
    $('#progressBar').click(function (e) {
        if (duration <= 0 || !isConnected) return;
        
        var percent = e.offsetX / $(this).width();
        var newTime = duration * percent;
        var timeMs = Math.floor(newTime * 1000);
        
        sendControlCommand('seek', { position: timeMs });
    });

    // 音量滑块
    var volumeTimeout = null;
    $('#volumeSlider').on('input', function () {
        currentVolume = parseInt($(this).val());
        $('#volumeValue').text(currentVolume + '%');
        updateVolumeIcon();
        
        // 防抖：延迟发送API请求
        clearTimeout(volumeTimeout);
        volumeTimeout = setTimeout(function () {
            sendControlCommand('volume', { percent: currentVolume });
        }, 300);
    });

    // 静音按钮
    var lastVolume = 50;
    $('#muteBtn').click(function () {
        if (currentVolume > 0) {
            lastVolume = currentVolume;
            currentVolume = 0;
        } else {
            currentVolume = lastVolume || 50;
        }
        
        $('#volumeSlider').val(currentVolume);
        $('#volumeValue').text(currentVolume + '%');
        updateVolumeIcon();
        sendControlCommand('volume', { percent: currentVolume });
    });

    // 弹幕设置面板切换
    $('#danmuToggleBtn').click(function () {
        $(this).toggleClass('collapsed');
        $('#danmuContent').toggleClass('show');
    });

    // 弹幕滑块事件 - 实时应用
    $('#danmuSize').on('input', function () {
        var val = $(this).val();
        $('#danmuSizeValue').text(val);
        applyDanmuSetting('danmuSize', val);
    });

    $('#danmuSpeed').on('input', function () {
        var val = $(this).val();
        $('#danmuSpeedValue').text(val);
        applyDanmuSetting('danmuSpeed', val);
    });

    $('#danmuAlpha').on('input', function () {
        var val = $(this).val();
        $('#danmuAlphaValue').text(val);
        applyDanmuSetting('danmuAlpha', val);
    });

    $('#danmuStoke').on('input', function () {
        var val = $(this).val();
        $('#danmuStokeValue').text(val);
        applyDanmuSetting('danmuStoke', val);
    });

    // 弹幕最大同屏数量 - 实时应用
    $('#danmuMaxCount').on('change', function () {
        var val = parseInt($(this).val() || 0);
        $('#danmuMaxCountValue').text(val === 0 ? '无限制' : val);
        applyDanmuSetting('danmuMaxCount', val);
    });

    // 弹幕最大显示行数 - 实时应用
    $('#danmuMaxLine').on('change', function () {
        var val = parseInt($(this).val() || -1);
        $('#danmuMaxLineValue').text(val === -1 ? '无限制' : val);
        applyDanmuSetting('danmuMaxLine', val);
    });

    // 弹幕显示类型复选框 - 实时应用
    $('#showMobileDanmu').on('change', function () {
        applyDanmuSetting('showMobileDanmu', $(this).is(':checked'));
    });

    $('#showBottomDanmu').on('change', function () {
        applyDanmuSetting('showBottomDanmu', $(this).is(':checked'));
    });

    $('#showTopDanmu').on('change', function () {
        applyDanmuSetting('showTopDanmu', $(this).is(':checked'));
    });

    // 云屏蔽复选框 - 实时应用
    $('#cloudDanmuBlock').on('change', function () {
        applyDanmuSetting('cloudDanmuBlock', $(this).is(':checked'));
    });

    // 弹幕语言选择 - 实时应用
    $('#danmuLanguage').on('change', function () {
        applyDanmuSetting('danmuLanguage', $(this).val());
    });

    // ===== 初始化 =====

    console.log('[init] 安卓版遥控器 - 初始化开始');

    // 从 localStorage 读取保存的配置
    function loadSavedConfig() {
        var savedIp = localStorage.getItem('remoteAndroidServerIp');
        var savedPort = localStorage.getItem('remoteAndroidServerPort');
        
        if (savedIp) {
            $('#serverIp').val(savedIp);
            console.log('[loadSavedConfig] 已加载保存的IP:', savedIp);
        }
        if (savedPort) {
            $('#serverPort').val(savedPort);
            console.log('[loadSavedConfig] 已加载保存的Port:', savedPort);
        }
        
        return (savedIp && savedPort);  // 返回是否有保存的配置
    }

    // 保存配置到 localStorage
    function saveConfig(ip, port) {
        localStorage.setItem('remoteAndroidServerIp', ip);
        localStorage.setItem('remoteAndroidServerPort', port);
        console.log('[saveConfig] 已保存配置 - IP:', ip, 'Port:', port);
    }

    // 初始化：禁用所有控制
    disableControls();
    
    // 页面加载时恢复保存的配置
    var hasSavedConfig = loadSavedConfig();
    
    // 页面加载时恢复弹幕设置
    loadDanmuSettings();
    
    console.log('[init] 安卓版遥控器 - 初始化完成');
    
    // 页面加载完成后，如果有保存的配置则自动连接
    if (hasSavedConfig) {
        console.log('[init] 自动尝试连接到上次保存的服务器...');
        setTimeout(function() {
            connectToServer();
        }, 500);  // 延迟500ms确保页面加载完成
    }

    // 页面离开时清理定时器
    $(window).on('beforeunload', function () {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    });

    // 定期更新播放状态（每2秒）- 连接成功后启动
    $(window).on('focus', function() {
        if (isConnected && !updateInterval) {
            updateInterval = setInterval(fetchCurrentStatus, 2000);
        }
    });

    $(window).on('blur', function() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    });
});
