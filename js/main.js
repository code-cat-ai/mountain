$(function () {

  /* ====================================================
     1. Banner 无缝循环轮播
     原理：在末尾追加第一张的克隆，播完后静默归位到真正第一张
  ==================================================== */
  var $slider = $('#bannerSlider');
  var slideTotal = 11;
  var slideNow = 0;   // 当前真实索引（0 ~ slideTotal-1）
  var isTransitioning = false;
  var autoTimer;

  // 在末尾追加第一张克隆，形成 [0,1,2,3,clone-0] 共5个
  var $cloneFirst = $slider.find('.banner-slide').first().clone();
  $cloneFirst.find('.pkg-new-badge').remove();
  $slider.append($cloneFirst);

  // 用绝对位置控制，避免 flex 宽度计算误差
  function setSlide(idx, animate) {
    if (animate === false) {
      $slider.css('transition', 'none');
    } else {
      $slider.css('transition', 'transform 0.4s cubic-bezier(.4,0,.2,1)');
    }
    $slider.css('transform', 'translateX(-' + idx * 100 + '%)');
  }

  function updateUI(realIdx) {
    $('#slideNow').text(realIdx + 1);
    $('.dot').removeClass('active').eq(realIdx).addClass('active');
  }

  function goSlide(idx) {
    if (isTransitioning) return;
    isTransitioning = true;

    // idx 可能是 -1（向左超界）或 slideTotal（向右超界）
    var targetIdx = idx;
    if (idx < 0) targetIdx = 0;         // 边界保护：不支持向左无缝（可扩展）

    setSlide(targetIdx, true);

    // 真实显示的圆点 / 计数器：克隆那张对应第1张
    var realIdx = targetIdx >= slideTotal ? 0 : targetIdx;
    updateUI(realIdx);

    // 过渡结束后处理
    $slider.one('transitionend webkitTransitionEnd', function () {
      if (targetIdx >= slideTotal) {
        // 已播到克隆的第一张，静默跳回真正第一张
        setSlide(0, false);
        slideNow = 0;
      } else {
        slideNow = targetIdx;
      }
      isTransitioning = false;
    });
  }

  function startAuto() {
    autoTimer = setInterval(function () {
      goSlide(slideNow + 1);
    }, 3500);
  }

  function stopAuto() {
    clearInterval(autoTimer);
  }

  startAuto();

  // 触摸滑动
  var touchStartX = 0;
  var touchEndX = 0;

  $slider.on('touchstart', function (e) {
    touchStartX = e.originalEvent.changedTouches[0].screenX;
    stopAuto();
  });

  $slider.on('touchend', function (e) {
    touchEndX = e.originalEvent.changedTouches[0].screenX;
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      goSlide(diff > 0 ? slideNow + 1 : slideNow - 1);
    }
    startAuto();
  });

  // 小圆点点击
  $('.banner-dots').on('click', '.dot', function () {
    goSlide($(this).index());
    stopAuto();
    startAuto();
  });


  /* ====================================================
     2. 收藏按钮
  ==================================================== */
  var isFav = false;

  $('#btnFav').on('click', function () {
    isFav = !isFav;
    var $icon = $('#favIcon');
    if (isFav) {
      $icon.removeClass('fa-regular fa-star').addClass('fa-solid fa-star');
      $icon.css('color', '#F5A623');
      showToast('已添加到收藏 ⭐');
    } else {
      $icon.removeClass('fa-solid fa-star').addClass('fa-regular fa-star');
      $icon.css('color', '');
      showToast('已取消收藏');
    }
  });


  /* ====================================================
     3. 分享按钮
  ==================================================== */

  var SHARE_TITLE = '树礼见山·茶馆·棋牌';
  var SHARE_DESC  = '隐于秦岭涝峪口的山间茶馆，喝茶赏景·棋牌娱乐·好友小聚，快来一起玩！';
  var SHARE_URL   = window.location.href;

  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  // 复制链接到剪贴板
  function copyShareLink(cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SHARE_URL).then(cb).catch(function () {
        legacyCopy(SHARE_URL);
        cb && cb();
      });
    } else {
      legacyCopy(SHARE_URL);
      cb && cb();
    }
  }

  function legacyCopy(text) {
    var $tmp = $('<textarea>').val(text).css({ position: 'fixed', opacity: 0 }).appendTo('body');
    $tmp[0].select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    $tmp.remove();
  }

  // 关闭微信引导遮罩
  function closeWechatGuide() {
    $('#shareWechatGuide').removeClass('open');
    $('body').css('overflow', '');
  }

  // 关闭分享面板
  function closeShareModal() {
    $('#shareModal').removeClass('open');
    $('body').css('overflow', '');
  }

  $('#btnShare').on('click', function () {
    if (isWeChat()) {
      // 微信内置浏览器：显示引导遮罩，提示用户点右上角菜单
      $('#shareWechatGuide').addClass('open');
      $('body').css('overflow', 'hidden');
    } else if (navigator.share) {
      // 支持原生分享（iOS Safari / Android Chrome 等）
      navigator.share({
        title: SHARE_TITLE,
        text: SHARE_DESC,
        url: SHARE_URL
      }).catch(function () { /* 用户取消，忽略 */ });
    } else {
      // 其他环境：显示底部分享面板
      $('#shareModal').addClass('open');
      $('body').css('overflow', 'hidden');
    }
  });

  // 微信引导遮罩：点任意处关闭
  $('#shareWechatGuide').on('click', closeWechatGuide);

  // 分享面板：分享给微信好友
  $('#shareToFriend').on('click', function () {
    copyShareLink(function () {
      closeShareModal();
      showToast('链接已复制，粘贴给微信好友吧 👥');
    });
  });

  // 分享面板：分享到朋友圈
  $('#shareToMoments').on('click', function () {
    copyShareLink(function () {
      closeShareModal();
      showToast('链接已复制，粘贴到朋友圈吧 🌟');
    });
  });

  // 分享面板：复制链接
  $('#shareCopyLink').on('click', function () {
    copyShareLink(function () {
      closeShareModal();
      showToast('链接已复制到剪贴板 🔗');
    });
  });

  // 分享面板取消
  $('#shareCancelBtn').on('click', closeShareModal);
  $('#shareModal').on('click', function (e) {
    if ($(e.target).is('#shareModal')) closeShareModal();
  });


  /* ====================================================
     4. 导航按钮
  ==================================================== */
  // ── 坐标定义（高德/腾讯均用 GCJ-02）──
  var NAV_NAME = '树礼见山茶馆';
  var NAV_ADDR = '陕西省西安市鄠邑区玉蝉街道西涝峪口村树礼见山茶馆';

  // 高德实测 GCJ-02 坐标
  var GCJ_LNG = 108.534783;
  var GCJ_LAT = 34.027491;

  // GCJ-02 → BD-09 转换（百度坐标系）
  function gcj02ToBd09(lng, lat) {
    var xPi = Math.PI * 3000.0 / 180.0;
    var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * xPi);
    var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * xPi);
    return {
      lng: +(z * Math.cos(theta) + 0.0065).toFixed(6),
      lat: +(z * Math.sin(theta) + 0.006).toFixed(6)
    };
  }

  var BD = gcj02ToBd09(GCJ_LNG, GCJ_LAT);  // 百度 BD-09 坐标

  // 显示地图选择弹窗
  function openNav() {
    $('#mapModal').addClass('open');
    $('body').css('overflow', 'hidden');
  }

  $('#btnNav, #btnNavMap').on('click', openNav);

  // 取消关闭
  $('#mapModalCancel').on('click', function () {
    $('#mapModal').removeClass('open');
    $('body').css('overflow', '');
  });
  $('#mapModal').on('click', function (e) {
    if ($(e.target).is('#mapModal')) {
      $('#mapModal').removeClass('open');
      $('body').css('overflow', '');
    }
  });

  // 各地图 App 唤起配置（坐标系各自对应）
  var mapApps = {
    // 高德：GCJ-02，dev=0 表示已是国测局坐标
    amap: {
      appUrl: 'amapuri://viewMap?sourceApplication=shulijianshanteahouse'
        + '&poiname=' + encodeURIComponent(NAV_NAME)
        + '&lat=' + GCJ_LAT + '&lon=' + GCJ_LNG + '&dev=0',
      webUrl: 'https://uri.amap.com/marker'
        + '?position=' + GCJ_LNG + ',' + GCJ_LAT
        + '&name=' + encodeURIComponent(NAV_NAME)
        + '&callnative=1'
    },
    // 百度：BD-09（由 GCJ-02 转换得到）
    baidu: {
      appUrl: 'baidumap://map/marker?location=' + BD.lat + ',' + BD.lng
        + '&title=' + encodeURIComponent(NAV_NAME)
        + '&content=' + encodeURIComponent(NAV_ADDR)
        + '&traffic=1&src=andr.baidu.openAPIdemo',
      webUrl: 'http://api.map.baidu.com/marker'
        + '?location=' + BD.lat + ',' + BD.lng
        + '&title=' + encodeURIComponent(NAV_NAME)
        + '&content=' + encodeURIComponent(NAV_ADDR)
        + '&output=html'
    },
    // 腾讯：GCJ-02（与高德相同坐标系）
    tencent: {
      appUrl: 'qqmap://map/marker?coord=' + GCJ_LAT + ',' + GCJ_LNG
        + '&title=' + encodeURIComponent(NAV_NAME)
        + '&addr=' + encodeURIComponent(NAV_ADDR),
      webUrl: 'https://apis.map.qq.com/uri/v1/marker'
        + '?marker=coord:' + GCJ_LAT + ',' + GCJ_LNG
        + ';title:' + encodeURIComponent(NAV_NAME)
        + ';addr:' + encodeURIComponent(NAV_ADDR)
        + '&referer=shulijianshanteahouse'
    }
  };

  // 点击地图选项：先尝试唤起 App，2s 未响应则打开网页版
  $('.map-picker-btn').on('click', function () {
    var key = $(this).data('map');
    var cfg = mapApps[key];
    if (!cfg) return;

    $('#mapModal').removeClass('open');
    $('body').css('overflow', '');

    var fallback = setTimeout(function () {
      window.open(cfg.webUrl, '_blank');
    }, 2000);

    // 页面失焦说明 App 被成功唤起，取消网页跳转
    $(window).one('blur', function () {
      clearTimeout(fallback);
    });

    window.location.href = cfg.appUrl;
  });


  /* ====================================================
     5. 门店介绍 展开/收起
  ==================================================== */
  var introOpen = false;

  $('#introToggle').on('click', function () {
    introOpen = !introOpen;
    var $content = $('#introContent');
    var $btn = $('#introToggle');
    if (introOpen) {
      $content.addClass('expanded');
      $('#introToggleText').text('收起');
      $btn.addClass('open');
    } else {
      $content.removeClass('expanded');
      $('#introToggleText').text('展开全部');
      $btn.removeClass('open');
    }
  });


  /* ====================================================
     6. 查看更多套餐
  ==================================================== */
  $('#btnMorePkg').on('click', function () {
    showToast('更多套餐即将上线，敬请期待！');
  });


  /* ====================================================
     7. 抢购按钮
  ==================================================== */
  $(document).on('click', '.btn-grab', function () {
    var $card = $(this).closest('.package-card');
    var title = $card.find('.pkg-title').text().replace(/【.*?】/, '').trim();
    var price = $card.find('.pkg-price').text();
    showToast('🎉 ' + price + ' 套餐抢购成功！');
  });


  /* ====================================================
     8. 预订弹窗
  ==================================================== */
  function openBookModal() {
    $('#bookModal').addClass('open');
    $('body').css('overflow', 'hidden');
    // 设置默认日期为明天
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var dd = String(tomorrow.getDate()).padStart(2, '0');
    var mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    var yyyy = tomorrow.getFullYear();
    $('#bookDate').val(yyyy + '-' + mm + '-' + dd);
  }

  function closeBookModal() {
    $('#bookModal').removeClass('open');
    $('body').css('overflow', '');
  }

  $('#btnBook, #floatBookBtn').on('click', openBookModal);
  $('#modalClose').on('click', closeBookModal);
  $('#bookModal').on('click', function (e) {
    if ($(e.target).is('#bookModal')) closeBookModal();
  });


  /* ====================================================
     9. 人数步进器
  ==================================================== */
  var personCount = 2;

  $('#stepMinus').on('click', function () {
    if (personCount > 1) {
      personCount--;
      $('#personCount').text(personCount);
    }
  });

  $('#stepPlus').on('click', function () {
    if (personCount < 20) {
      personCount++;
      $('#personCount').text(personCount);
    }
  });


  /* ====================================================
     10. 确认预订
  ==================================================== */
  $('#btnConfirmBook').on('click', function () {
    var name = $.trim($('#bookName').val());
    var phone = $.trim($('#bookPhone').val());
    var date = $('#bookDate').val();
    var time = $('#bookTime').val();

    if (!name) { showToast('请输入姓名'); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { showToast('请输入正确的手机号'); return; }
    if (!date) { showToast('请选择预订日期'); return; }
    if (!time) { showToast('请选择预订时间'); return; }

    closeBookModal();
    setTimeout(function () {
      $('#successModal').addClass('open').css('display', 'flex');
    }, 300);
  });

  $('#btnSuccessClose').on('click', function () {
    $('#successModal').removeClass('open').hide();
  });

  $('#successModal').on('click', function (e) {
    if ($(e.target).is('#successModal')) {
      $('#successModal').removeClass('open').hide();
    }
  });


  /* ====================================================
     11. 浮动预订按钮 — 滚动控制
  ==================================================== */
  var $ctaSection = $('.cta-section');
  var $floatBook = $('#floatBook');

  $(window).on('scroll', function () {
    var ctaBottom = $ctaSection.offset().top + $ctaSection.outerHeight();
    if ($(window).scrollTop() > ctaBottom - 60) {
      $floatBook.addClass('visible');
    } else {
      $floatBook.removeClass('visible');
    }
  });


  /* ====================================================
     12. Tab 导航切换
  ==================================================== */
  $('.tab-item').on('click', function () {
    var tab = $(this).data('tab');
    $('.tab-item').removeClass('tab-active');
    $(this).addClass('tab-active');
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'orders') {
      openBookModal();
      setTimeout(function () {
        $('.tab-item').removeClass('tab-active');
        $('[data-tab="orders"]').addClass('tab-active');
      }, 10);
    } else if (tab === 'member') {
      showToast('会员功能即将开放，敬请期待！');
    } else if (tab === 'profile') {
      showToast('请先登录以查看个人中心');
    }
  });


  /* ====================================================
     13. 更多评价
  ==================================================== */
  $('#btnMoreReviews').on('click', function () {
    showToast('更多评价即将加载…');
  });


  /* ====================================================
     14. Toast 工具函数
  ==================================================== */
  var toastTimer;

  function showToast(msg) {
    clearTimeout(toastTimer);
    var $t = $('#toast');
    $t.text(msg).addClass('show');
    toastTimer = setTimeout(function () {
      $t.removeClass('show');
    }, 2200);
  }


  /* ====================================================
     15. 返回按钮
  ==================================================== */
  $('#btnBack').on('click', function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      showToast('已是第一页');
    }
  });


  /* ====================================================
     16. 页面入场动画（IntersectionObserver）
  ==================================================== */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          $(entry.target).css({
            opacity: 1,
            transform: 'translateY(0)'
          });
        }
      });
    }, { threshold: 0.1 });

    // 为各 section 添加初始隐藏状态
    var $sections = $('.shop-info-card, .cta-section, .coupon-banner, .packages-section, .highlights-section, .intro-section, .reviews-section, .map-section');

    $sections.each(function (i) {
      $(this).css({
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.45s ease ' + (i * 0.06) + 's, transform 0.45s ease ' + (i * 0.06) + 's'
      });
      observer.observe(this);
    });
  }

});

/* ====================================================
   点击静态地图 → 打开腾讯地图网页查看位置
==================================================== */
function openTencentMapWeb() {
  var url = 'https://apis.map.qq.com/uri/v1/marker'
    + '?marker=coord:34.027491,108.534783'
    + ';title:' + encodeURIComponent('树礼见山茶馆')
    + ';addr:' + encodeURIComponent('陕西省西安市鄠邑区玉蝉街道西涝峪口村树礼见山茶馆')
    + '&referer=shulijianshanteahouse';
  window.open(url, '_blank');
}
