$(function () {
  'use strict';

  
  var URL = window.URL || window.webkitURL;
  // 裁切图像
  var $image = $("#clip_src_img");
  var $fileInput = $("#file_input");
  var $preImage = $(".pre-container");
  var $changeLabel = $(".change-label");
  var resetImg = $(".reset-img");
  var detail = null;
  var options = {
    aspectRatio: 1,
    guides: true,
    viewMode: 1,
    dragMode: "none",
    cropBoxResizable: false,
    zoomable: false,
    minCanvasWidth: 0,
    minCanvasHeight: 0,
    minCropBoxWidth: 180,
    minCropBoxHeight: 180,
    minContainerWidth: 180,
    minContainerHeight: 180,
    preview: '.pre-container',
    crop: function (e) {
      detail = e.detail;
      console.log(e);
    }
  }
  /* 原图像 */
  var originalImageURL = $image.attr('src');
  /* 上传图像 */
  var uploadedImageName = null;
  /* 上传类型 */
  var uploadedImageType = null;
  var uploadedImageURL;

  /* 工具函数 */
  function BrowserType() {
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
    var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器  
    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器  
    var isEdge = userAgent.indexOf("Windows NT 6.1; Trident/7.0;") > -1 && !isIE; //判断是否IE的Edge浏览器  
    var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器  
    var isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1; //判断是否Safari浏览器  
    var isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1; //判断Chrome浏览器  

    if (isIE) {
      var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
      reIE.test(userAgent);
      var fIEVersion = parseFloat(RegExp["$1"]);
      // if (fIEVersion == 7) { return "IE7"; }
      // else if (fIEVersion == 8) { return "IE8"; }
      if (fIEVersion == 9) { return "IE9"; }
      else if (fIEVersion == 10) { return "IE10"; }
      else if (fIEVersion == 11) { return "IE11"; }
      else { return "0" }//IE版本过低  
    }//isIE end  

    if (isFF) { return "FF"; }
    if (isOpera) { return "Opera"; }
    if (isSafari) { return "Safari"; }
    if (isChrome) { return "Chrome"; }
    if (isEdge) { return "Edge"; }
  }
  function calcImageSize(file, maxSize) {
    if (!file) {
      console.error("file require");
    }
    var maxSize = 1024 * maxSize;
    if (file.size > maxSize) {
      alert("上传图片不能大于2M");
      return false;
    }
    return true;
  }
  /* 工具函数 */

  /* 上传函数 */
  function FileUploadMulti() {
    var file = $fileInput[0].files[0];
    console.log(file);
    console.log(detail);
    var q = jQuery.Deferred();
    console.log($image.cropper("getImageData"));
    /* 上传图片函数 */
    $.ajax({
      url: 'upload.php',
      type: "POST",
      data: "name=John&location=Boston",
      async: true,
      success: function (res, status) { 
        q.resolve(data);
      },
      error: function (res,status) {
        q.reject(res, status);
       }
    })
    return q;
  }
  /* 上传函数 */




  $image.on({
    ready: function (e) {
    },
    cropstart: function (e) {
    },
    cropmove: function (e) {
    },
    cropend: function (e) {
    },
    crop: function (e) {
    },
    zoom: function (e) {
    }
  });

  // 上传图片
  if (URL || BrowserType == '0') {
    $fileInput.change(function () {
      var files = this.files;
      var file;
      // if (!$image.data('cropper')) {
      //   return false;
      // }
      if (files && files.length) {
        file = files[0];
        if (!calcImageSize(file, 2000)) {
          $fileInput.val('');
          return false;
        }
        if (/^image\/\w+$/.test(file.type)) {

          uploadedImageName = file.name;
          uploadedImageType = file.type;

          if (uploadedImageURL) {
            URL.revokeObjectURL(uploadedImageURL);
          }
          uploadedImageURL = URL.createObjectURL(file);
          console.log(uploadedImageURL);
          
          $image.cropper('destroy').attr('src', uploadedImageURL).cropper(options);

          $preImage.css({
            backgroundImage: " "
          });
          $changeLabel.css({
            display: "none"
          });
          resetImg.css({
            display:"block"
          })
          $(".upload_btn").removeClass("disabled");
        } else {
          window.alert('Please choose an image file.');
        }
      }
    })
  } else {
    $(".content-box").empty().css({"minHeight":500,"position":"relative"}).append($("<p class='browsehappy'> <span><img width='250' height=250' src='../images/b64543a98226cffcc7ed97adb3014a90f703eaee.png'/></span> 您正在使用 <strong>旧浏览器</strong> . 为了更好的体验，请 <a class='bodycolor' target='_blank' href='http://browsehappy.com/'>更新</a> 您的浏览器.</p>"));
    $(".upload_btn").prop('disabled', true).addClass('disabled');
  }


  /* 点击更新按钮 */
  $(".upload_btn").click(function (e) {
    e.preventDefault();
    if (!$fileInput.val()) {
      return false;
    }
    FileUploadMulti().then(function (res, status) {
      alert("更新成功")
    }).fail(function () {
      alert("提交失败，请重新尝试");
    })
  })


})

