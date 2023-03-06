<template>
  <div class="pdfSign">
    <div class="pdfSign-content">
      <div id="pdf"></div>
    </div>
    <div class="sign-wrapper" v-show="showSign">
      <Sign class="dd" :width="375" :height="200" :isCrop="false" :lineWidth="3" lineColor="black" bgColor="rgba(0,0,0,0)" @hasDraw="changDraw" ref="sign"></Sign>
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
      resultImg: '', // 最终画布生成的base64图片
      resultImgBlob: '', // 最终画布生成的BLOB图片
      isCrop: false, // 是否裁剪，在画布设定尺寸基础上裁掉四周空白部分
      isDraw: false, // 是否在绘制
      showSign: false,
      pdfh5: null,
      // 可引入网络文件或者本地文件
      // pdfUrl: 'https://pdf-lib.js.org/assets/with_update_sections.pdf', // 如果引入本地pdf文件，需要将pdf放在public文件夹下，引用时使用绝对路径（/：表示public文件夹）
      pdfUrl: '/test.pdf', // 如果引入本地pdf文件，需要将pdf放在public文件夹下，引用时使用绝对路径（/：表示public文件夹）
      // pdf的信息
      pdfInfo: {
        domWidth: 0,
        domHeight: 0,
        docWidth: 0,
        docHeight: 0
      },
      // 记录之前的位移，按照放大比例为1所得的位移
      moveX: 0,
      moveY: 0,
      // 记录本次位移的开始位置
      startDingwei: {
        x: 0,
        y: 0
      },
      // 记录本次位移的移动时位置
      moveDingwei: {
        x: 0,
        y: 0
      },
      // 是不是单个手指触摸(判断防止因为在触发双指时,两个手指都移动导致weizhi字段记录的坐标和双指不同时离开屏幕导致有触发单指的情况,这种情况导致的图片位置跳动)
      isOne: true,
      // 记录双指之间的距离
      startDistance: 1,
      moveDistance: 1,
      maxWidth: 360,
      minWidth: 100,
      originWidth: 0,
      originLeft: 0,
      ballStartPosition: {
        x: 0,
        y: 0
      },
      ballMovePosition: {
        x: 0,
        y: 0
      },
      marginB: 8
    }
  },
  computed: {

  },
  methods: {
    /**
     * 计算双指之间的距离
     */
    getDistance (start, stop) {
      return Math.sqrt(Math.pow(stop.x - start.x, 2) + Math.pow(stop.y - start.y, 2))
    },
    startSign () {
      this.showSign = true
      this.removeSign()
    },
    removeSign() {
      const sign = document.querySelector('.my-sign')
      sign && sign.parentNode.removeChild(sign)
    },
    async finishSign () {
      await this.getPic()
      this.showSign = false
      const sign = document.createElement('div')
      sign.className = 'my-sign'
      sign.id = 'my-sign'
      // 此事件用于修改签名的位置
      sign.ontouchstart = this.start
      sign.ontouchmove = this.move
      sign.ontouchend = this.end
      const pdfDom = document.querySelector('.pdfViewer')
      pdfDom.appendChild(sign)
      // 放到正中间
      const wrapper = pdfDom.parentNode
      const top = (wrapper.scrollTop + wrapper.clientHeight)
      const width = parseFloat(wrapper.clientWidth)
      const left = width / 2 - (width / 3) / 2
      // console.log(pdfDom.scrollTop, pdfDom.scrollHeight, pdfDom.clientHeight, wrapper.scrollTop, wrapper.scrollHeight, wrapper.clientHeight, top)
      sign.style.top = top + 'px'
      sign.style.left = left + 'px'
      this.originLeft = left
      // 默认三分之一的宽
      sign.style.width = width / 3 + 'px'
      this.originWidth = width / 3
      this.moveY = top
      this.moveX = left
      this.maxWidth = width
      // 添加签字图片
      const img = document.createElement('img')
      img.src = this.resultImg
      sign.appendChild(img)
      // 添加四个球
      new Array(4).fill(null).map((item, index) => {
        const ball = document.createElement('div')
        ball.className = `ball ball${index}`
        // 此事件用于修改签名的大小
        ball.ontouchstart = (e) => this.ballStart(e, index)
        ball.ontouchmove = (e) => this.ballMove(e, index)
        ball.ontouchend = (e) => this.ballEnd(e, index)
        sign.appendChild(ball)
      })
    },
    ballStart(e, index) {
      e.stopPropagation()
      e.preventDefault()
      // 是单指触摸,保存开始的位置
      this.ballStartPosition = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
      const parent = e.target.parentNode
      this.originWidth = parseFloat(parent.style.width)
      this.originLeft = parseFloat(parent.style.left)
    },
    ballMove(e, index) {
      e.stopPropagation()
      e.preventDefault()
      // 记录当前的位置
      this.ballMovePosition = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
      // 计算移动的位置
      const moveX = (this.ballMovePosition.x - this.ballStartPosition.x)
      const moveY = (this.ballMovePosition.y - this.ballStartPosition.y)
      const parent = e.target.parentNode
      const originWidth = this.originWidth
      const originLeft = this.originLeft
      // 位移距离加上原来的距离
      if ([0, 3].includes(index)) {
        // 左上和左下的圆球
        const moreWidth = (originWidth - moveX < this.minWidth) ? (this.minWidth - (originWidth - moveX)) : 0
        const lessWidth = (originWidth - moveX > this.maxWidth) ? (this.maxWidth - (originWidth - moveX)) : 0
        parent.style.width = originWidth - moveX + moreWidth + lessWidth + 'px'
        parent.style.left = originLeft + moveX - moreWidth - lessWidth + 'px'
      } else {
        // 右上和右下的圆球
        const moreWidth = (originWidth + moveX < this.minWidth) ? (this.minWidth - (originWidth + moveX)) : 0
        const lessWidth = (originWidth + moveX > this.maxWidth) ? (this.maxWidth - (originWidth + moveX)) : 0
        parent.style.width = originWidth + moveX + moreWidth + lessWidth + 'px'
      }
    },
    ballEnd(e, index) {
      e.stopPropagation()
      e.preventDefault()
      this.ballMovePosition = { ...this.ballStartPosition }
      const parent = e.target.parentNode
      this.originWidth = parseFloat(parent.style.width)
      this.originLeft = parseFloat(parent.style.left)
    },
    start (e) {
      e.stopPropagation()
      e.preventDefault()
      if (e.touches.length == 1) {
        // 是单指触摸,保存开始的位置
        this.isOne = true
        this.startDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
      }
    },
    move (e) {
      e.stopPropagation()
      e.preventDefault()
      if (e.touches.length == 1) {
        // 开始移动,防止双指放大之后离开一指导致图片跳动,更新一下图片位置
        if (!this.isOne) {
          this.isOne = true
          this.startDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
        }
        // 记录当前的位置
        this.moveDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
        // 计算移动的位置
        let moveX = (this.moveDingwei.x - this.startDingwei.x)
        let moveY = (this.moveDingwei.y - this.startDingwei.y)
        // 位移距离加上原来的距离
        moveX += this.moveX
        moveY += this.moveY
        e.target.style.top = parseFloat(moveY) + 'px'
        e.target.style.left = parseFloat(moveX) + 'px'
      }
    },
    end (e) {
      e.stopPropagation()
      e.preventDefault()
      if (this.isOne) {
        // 获取当前的位移距离
        this.$nextTick(() => {
          const moveX = e.target.style.left
          const moveY = e.target.style.top
          this.moveX = parseFloat(moveX)
          this.moveY = parseFloat(moveY)
          // 防止误触发两次'end'
          this.moveDingwei = { ...this.startDingwei }
        })
      }
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
    getPosition (pdfDoc) {
      return new Promise((resolve, reject) => {
        this.$nextTick(() => {
          const pages = pdfDoc.getPages()
          const pdfDom = document.querySelector('.pdfViewer')
          const sign = document.querySelector('#my-sign')
          // 每一页pdf的dom高度（包含mariginB - 8）
          const eachPageDomHeight = pdfDom.scrollHeight / pages.length
          const eachPageDomWidth = pdfDom.clientWidth
          const signTop = parseFloat(sign.style.top)
          const signLeft = parseFloat(sign.style.left)

          const currentPage = Math.ceil(signTop / eachPageDomHeight)
          // console.log(currentPage)
          const currentHeight = signTop - (currentPage - 1) * eachPageDomHeight
          // 每一页的pdf高度
          const eachPageHeight = pages[0].getHeight()
          const eachPageWidth = pages[0].getWidth()
          // 获取当前签名顶部相对当前pdf页的偏移量
          const y = (currentHeight / (eachPageDomHeight - this.marginB)) * eachPageHeight
          // 获取当前签名左侧相对当前pdf页的偏移量
          const x = (signLeft / eachPageDomWidth) * eachPageWidth
          // 获取当前签名相对当前pdf页的宽度 - 不计算高度是因为签名的长宽比例固定
          const width = parseFloat(sign.style.width) / eachPageDomWidth * eachPageWidth
          resolve({
            x, y, width, currentPage
          })
        })
      })
    },
    async save () {
      const pdfBase64 = await this.getPdf()
      const pdfDoc = await PDFDocument.load(pdfBase64)
      const pages = pdfDoc.getPages()
      this.pdfInfo.docWidth = pages[0].getWidth()
      this.pdfInfo.docHeight = pages[0].getHeight()
      const { x, y, width, currentPage } = await this.getPosition(pdfDoc)
      const img = this.resultImgBlob
      blobToArrayBuffer(img, async (img2) => {
        const ImgCover = img2
        const eleImgCover = await pdfDoc.embedPng(ImgCover)
        // 获取当前pdf中的图片相对原签名的比例
        const scale = width / eleImgCover.width
        const eleImgCover2 = eleImgCover.scale(scale)
        pages.forEach(async (item, index) => {
          if (index === currentPage - 1) {
            // 加图片
            item.drawImage(eleImgCover, {
              x: x,
              // 这个y的定位是从当前页的底部开始计算的，而且基准是对准图片的底部的
              y: item.getHeight() - y - eleImgCover2.height,
              width: eleImgCover2.width,
              height: eleImgCover2.height
            })
            // 加文字
            // const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
            // const date = formatDate(undefined, '-')
            // item.drawText(date, {
            //   x: item.getWidth() / 3 * 2,
            //   y: item.getHeight() / 2,
            //   size: 12
            // // font: timesRomanFont,
            // // color: rgb(0, 0.53, 0.71),
            // // rotate: degrees(-45)
            // })
          }
        })
        this.pdfBytes = await pdfDoc.saveAsBase64()
        this.pdfBytes = 'data:application/pdf;base64,' + this.pdfBytes
        console.log(this.pdfBytes)
        // setTimeout(() => {
        this.downloadFile()
        // }, 3000)
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
    setTimeout(() => {
      const pdfDom = document.querySelector('.pdfViewer')
      pdfDom.addEventListener('scroll', (e) => {
        console.log(e)
      })
    }, 3000)
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
  pointer-events: all;
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
    height: 100%;
    width: 100%;
    pointer-events: none;
    // height: 100%;
    // width: 100%;
  }
  .btns {
    position: absolute;
    bottom: 10px;
    left: 0;
    width: 100%;
    z-index: 999999;
  }
  :deep(.pdfjs .pdfViewer){
    padding: 0px !important;
  }
  :deep(#my-sign){
    position: absolute;
    border: 1px solid orange;
    top:0;
    left:0;
    z-index: 999;
    width: 100%;
    display: block;
    // min-width: 100px !important;
    // max-width: 100% !important;
    img{
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
    }
    .ball{
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #fff;
      border: 2px solid black;
      box-sizing: border-box;
      &0{
        top: 0;
        left: 0;
        transform: translate(-50%,-50%);
      }
      &1{
        top: 0;
        right: 0;
        transform: translate(50%,-50%);
      }
      &2{
        bottom: 0;
        right: 0;
        transform: translate(50%,50%);
      }
      &3{
        bottom: 0;
        left: 0;
        transform: translate(-50%,50%);
      }
    }
  }
}
</style>
