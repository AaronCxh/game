!(function ($, $$, window) {
  "use strict";
  if (!$) {
    console.error("jQuery is not defined");
    return false;
  }

  var uploader,
    $imageContainer = $('#preview-box');  //上传预览容器ID
    $imageInput = $("#_ImgUrl")//图片隐藏域ID
  uploader = WebUploader.create({
    // 选完文件后，是否自动上传。
    auto: true,
    // swf文件路径
    swf: './Uploader.swf',
    // 文件接收服务端。
    server: '/Include/AjaxUploader/Uploader.aspx?t=uploadbyUser',
    // 选择文件的按钮。可选。
    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
    pick: '#filePicker',
    // 只允许选择图片文件。
    accept: {
      title: 'Images',
      extensions: 'gif,jpg,jpeg,bmp,png',
      mimeTypes: 'image/*'
    },
    resize: false,
    disableGlobalDnd: true,
    fileNumLimit: 2,
    // fileSizeLimit: 200 * 1024 * 1024,
    fileSingleSizeLimit: 2 * 1024 * 1024  //2M
  });

  uploader.onFileQueued = function (file) {
    addFile(file)
  };

  uploader.onFileDequeued = function (file) {
  };
  uploader.on('dialogOpen', function () {
    console.log('here');
  });

  // 文件上传过程中创建进度条实时显示。
  uploader.on('uploadProgress', function (file, percentage) {
    if (Zepto) {
      Zepto.showPreloader('图片上传中，请稍等...')
    } else {
      alert('进度');
    }
  });

  uploader.onError = function (code) {
    if (Zepto) {
      Zepto.toast(code);
    } else if (showtip) {
      showtip(code);
    } else {
      alert(code);
    }
  };

  uploader.on('uploadError', function (file) {
    if (Zepto) {
      Zepto.toast("上传失败");
      console.log(file);
      // $imageContainer.append("<li><a><div class='mask del_btn' onclick='delThis(this)'><span>删除</span></div><img src='" + '' + "'></a></li>");
    } else {
      alert('上传失败，请重新上传');
    }
  });

  uploader.on('uploadComplete', function (file) {
    // alert('上传完成');
    Zepto.hidePreloader();
    // console.log(file);
    // Zepto.toast();
  });

  uploader.on("uploadSuccess", function (file, response) {
    if (Zepto) {
      Zepto.toast("上传成功");
    } else {
      alert('上传成功');
    }
    dowork(response);
  });


  /* 图片预览 */
  function dowork(e) {
    var strFileName = e;
    var result = strFileName.split(",");
    var ImgUrlArr = clear_arr_trim($imageInput.val().split(","));
    if (result.length > 5 || (ImgUrlArr.length + result.length) > 5) {
      return showtip("最多只能上传5张图片");
    }
    var _houseid = '';
    var ImgUrl = $imageInput.val();
    for (var i = 0; i < result.length; i++) {
      ImgUrl = result[i] + ',' + ImgUrl;
      $imageContainer.append("<li><a><div class='mask del_btn'>删除</div><img src='" + result[i] + "'></a></li>");
    }
    //  ImgUrl = ImgUrl.split(",").pop().join(",");
    temp = ImgUrl.split(",");
    var temp = clear_arr_trim(temp);
    ImgUrl = temp.join(",");
    $imageInput.val(ImgUrl);


  }

  /* 图片上传版本二 */
  function addFile(file) {
    var $li = $("<li id=" + file.id + "><a><div class='mask del_btn'>删除</div><img></a></li>"),
      $img = $li.find('img');
    $imageContainer.append($li);

    //创建缩略图
    uploader.makeThumb(file, function (error, src) {
      if (error) {
        if(Zepto){
          Zepto.toast("预览失败，请重新上传");
        }else if(showtip){
          showtip("预览失败，请重新上传");
        }else{
          alert("预览失败，请重新上传");
        }
        return;
      }
      $img.attr('src', src);
    }, 160, 100);
    $li.on("click", '.del_btn', function (e) {
      delFile(e);
      uploader.removeFile(file);
    })
  }

  /* 删除 */
  function delFile(e) {
    var li = $(e.target).parent().parent();
    console.log(li);
    var imgSrc = li.find("img").attr("src");
    var imageSet = clear_arr_trim($imageInput.val().split(","));
    var len = imageSet.length;
    for (var i = len; i >= 0; i--) {
      if (imageSet[i] == imgSrc) {
        imageSet.splice(i, 1);
        break;
      }
    }
    var temp = imageSet.join(",");
    $imageInput.val(temp);
    li.remove();
  }


  /* 清除数组空值 */
  function clear_arr_trim(array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] == "" || typeof (array[i]) == "undefined") {
        array.splice(i, 1);
        i = i - 1;
      }
    }
    return array;
  }
})(jQuery, Zepto, window)