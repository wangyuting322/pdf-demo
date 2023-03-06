<template>
  <div class="pdfSign">
    <div class="pdfSign-content">
      <div id="pdf"></div>
    </div>
    <div class="sign-wrapper" v-show="showSign">
      <Sign class="dd" :width="375" :height="200" :isCrop="isCrop" :lineWidth="lineWidth" :lineColor="lineColor" :bgColor.sync="bgColor" @hasDraw="changDraw" ref="sign"></Sign>
    </div>
    <div class="img-wrapper" v-show="showImg">
      <Pic :src="resultImg" ref="pic"></Pic>
    </div>
    <div class="btns">
      <span @click="startSign">签名</span>
      <span @click="finishSign">结束签名</span>
      <span @click="save">保存</span>
    </div>
  </div>
</template>

<script>
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { fileToBlob, blobToArrayBuffer, downloadAction, base64ToFile } from '@/utils/file'
import { formatDate } from '@/utils/time'
import Pdfh5 from 'pdfh5'
import 'pdfh5/css/pdfh5.css'
import Pic from '@/components/Pic.vue'
import Sign from '@/components/Sign.vue'

export default {
  name: 'pdfSign',
  components: {
    Pic,
    Sign
  },
  props: {

  },
  data () {
    return {
      lineWidth: 3, // 画笔的线条粗细
      lineColor: 'black', // 画笔的颜色
      // bgColor: '#fff', // 画布的背景颜色
      bgColor: 'rgba(0,0,0,0)', // 画布的背景颜色
      resultImg: '', // 最终画布生成的base64图片
      resultImgBlob: '', // 最终画布生成的BLOB图片
      isCrop: false, // 是否裁剪，在画布设定尺寸基础上裁掉四周空白部分
      isDraw: false, // 是否在绘制
      showImg: false,
      showSign: false,
      pdfh5: null,
      // 可引入网络文件或者本地文件
      pdfUrl: 'https://pdf-lib.js.org/assets/with_update_sections.pdf' // 如果引入本地pdf文件，需要将pdf放在public文件夹下，引用时使用绝对路径（/：表示public文件夹）
    }
  },
  computed: {

  },
  methods: {
    startSign() {
      this.showSign = true
    },
    async finishSign() {
      await this.getPic()
      this.showSign = false
      this.showImg = true
    },
    /**
     * 是否在绘制中
     */
    changDraw (d) {
      this.isDraw = d
      if (d) {
        // 移动端其他输入框取消聚焦
        const areaArr = document.querySelectorAll('textarea')
        areaArr.forEach((item) => {
          item && item.blur && item.blur()
        })
        const inputArr = document.querySelectorAll('input')
        inputArr.forEach((item) => {
          item && item.blur && item.blur()
        })
      }
    },
    /**
     * 获取图片blob格式
     */
    async getPic () {
      const sign = this.$refs.sign
      // 获取图片的base64
      const resultImg = await sign.generate()
      // 获取file格式的图片
      const file = base64ToFile(resultImg, `${(new Date()).getTime()}.png`)
      // 获取blob格式的图片
      this.resultImg = resultImg
      this.resultImgBlob = await fileToBlob(file)
    },
    /**
     * 获取选中的pdf文件
     */
    getPdf () {
      // 采用网络图片
      return fetch(this.pdfUrl).then(res => res.arrayBuffer())
    },
    async save() {
      const pdfBase64 = await this.getPdf()
      const pdfDoc = await PDFDocument.load(pdfBase64)
      const pages = pdfDoc.getPages()
      const img = this.resultImgBlob
      blobToArrayBuffer(img, async (img2) => {
        const ImgCover = img2
        const eleImgCover = await pdfDoc.embedPng(ImgCover)
        // jpg和png格式的图片
        // const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
        // const pngImage = await pdfDoc.embedPng(pngImageBytes)
        // 设置图片的放大倍数
        // const jpgDims = jpgImage.scale(0.5)
        // const pngDims = pngImage.scale(0.5)
        const imgSign = this.$refs.pic
        const scale = imgSign.scale
        const moveX = imgSign.moveX
        const moveY = imgSign.moveY
        const eleImgCover2 = eleImgCover.scale(scale)
        pages.forEach(async (item, index) => {
          console.log(item, pdfDoc)
          debugger
          if (index === pages.length - 1) {
            // 加图片
            item.drawImage(eleImgCover2, {
              // x: item.getWidth() / 2 - eleImgCover.width / 4,
              // x: item.getWidth() / 3 * 2,
              // y: item.getHeight() / 2,
              x: moveX,
              y: moveY,
              // width: eleImgCover2.width / 2,
              // height: eleImgCover2.height / 2
              width: eleImgCover2.width,
              height: eleImgCover2.height
            })
            // 加文字
            // const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
            const date = formatDate(undefined, '-')
            item.drawText(date, {
              x: item.getWidth() / 3 * 2,
              y: item.getHeight() / 2,
              size: 12
              // font: timesRomanFont,
              // color: rgb(0, 0.53, 0.71),
              // rotate: degrees(-45)
            })
          }
        })
        this.pdfBytes = await pdfDoc.saveAsBase64()
        this.pdfBytes = 'data:application/pdf;base64,' + this.pdfBytes
        setTimeout(() => {
          this.downloadFile()
        }, 3000)
      })
    },
    /**
     * 下载pdf - 高版本的chrome中不支持直接下载base64的文件，可在qq浏览器等中下载
     */
    downloadFile () {
      downloadAction(this.pdfBytes, 'test.pdf').then(() => {
        // const fileInput = this.$refs.fileInput
        // const imageInput = this.$refs.imageInput
        // fileInput.value = ''
        // imageInput.value = ''
      })
    }
  },
  watch: {

  },
  created () {

  },
  mounted () {
    // https://github.com/gjTool/pdfh5
    // pdfh5实例化时传两个参数：selector选择器，options配置项参数，会返回一个pdfh5实例对象，可以用来操作pdf，监听相关事件
    // pdfh5 = new Pdfh5(selector, options) goto初始到第几页，logo设置每一页pdf上的水印
    // this.pdfh5 = new Pdfh5('#pdf', { pdfurl: this.pdfUrl, goto: 1, logo: { src: require('../assets/logo.png'), x: 420, y: 700, width: 120, height: 120 } })
    this.pdfh5 = new Pdfh5('#pdf', { pdfurl: this.pdfUrl, goto: 1 })
    // 监听pdf准备开始渲染，此时可以拿到pdf总页数
    this.pdfh5.on('ready', function () {
      console.log('总页数:' + this.totalNum)
    })
    // 监听pdf加载完成事件，加载失败、渲染成功都会触发
    this.pdfh5.on('complete', (status, msg, time) => {
      console.log('状态:' + status + '，信息:' + msg + '，耗时:' + time + '毫秒')
    })
  },
  beforeDestroy () {

  }
}
</script>
<style lang="scss" scoped>
.pdfSign {
  height: 0;
  flex-grow: 1;
  position: relative;
  .pdfSign-content {
    position: relative;
    height: 100%;
    width: 100%;
  }
  .sign-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: fit-content;
    width: fit-content;
    background-color: red;
    // height: 100%;
    // width: 100%;
  }
  .img-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: fit-content;
    width: fit-content;
    // height: 100%;
    // width: 100%;
  }
  .btns {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 999999;
  }
}
</style>
