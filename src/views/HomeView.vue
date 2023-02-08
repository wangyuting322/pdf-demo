<template>
  <div class="home">
    <!-- <object src="./test.pdf"><embed src="./test.pdf"></embed></object> -->
    <div>1、先选择pdf</div>
    <input type="file" ref="fileInput" />
    <div>2、选择一张图片</div>
    <input type="file" ref="imageInput" />
    <div>3、给pdf添加图片</div>
    <button @click="handleClick">合成</button>
    <div>4、下载合成后的pdf</div>
    <div @click="downloadFile">下载</div>
    <!-- <a :href="pdfBytes" download='test.pdf'>下载合成后的pdf</a> -->
  </div>
</template>

<script>
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { fileToBlob, blobToArrayBuffer, downloadAction } from '@/utils/file'
export default {
  name: 'HomeView',
  components: {
  },
  data: function () {
    return {
      pdfBytes: ''
    }
  },
  methods: {
    /**
     * 获取选中的pdf文件
     */
    getPdf () {
      return new Promise((resolve, reject) => {
        const inputFile = this.$refs.fileInput.files[0]
        const reader = new FileReader()
        reader.readAsDataURL(inputFile)
        reader.onload = async (e) => {
          const pdfBase64 = e.target.result
          // pdf的base64
          resolve(pdfBase64)
        }
      })
    },
    /**
     * 获取选中的图片文件
     */
    getImg () {
      return new Promise((resolve, reject) => {
        const img = this.$refs.imageInput.files[0]
        return fileToBlob(img).then((res) => {
          resolve(res)
        })
      })
    },
    /**
     * pdf中进行操作
     * @doc https://pdf-lib.js.org/
     */
    async handleClick () {
      const pdfBase64 = await this.getPdf()
      const pdfDoc = await PDFDocument.load(pdfBase64)
      const pages = pdfDoc.getPages()
      const img = await this.getImg()
      blobToArrayBuffer(img, async (img2) => {
        const ImgCover = img2
        const eleImgCover = await pdfDoc.embedPng(ImgCover)
        // jpg和png格式的图片
        // const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
        // const pngImage = await pdfDoc.embedPng(pngImageBytes)
        // 设置图片的放大倍数
        // const jpgDims = jpgImage.scale(0.5)
        // const pngDims = pngImage.scale(0.5)
        pages.forEach(async (item, index) => {
          if (index === pages.length - 1) {
            // 加图片
            item.drawImage(eleImgCover, {
              // x: item.getWidth() / 2 - eleImgCover.width / 4,
              x: item.getWidth() / 3 * 2,
              y: item.getHeight() / 2,
              width: eleImgCover.width / 2,
              height: eleImgCover.height / 2
            })
            // 加文字
            const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
            item.drawText('Creating PDFs in JavaScript is awesome!', {
              x: item.getWidth() / 3 * 2,
              y: item.getHeight() / 2,
              size: 30,
              font: timesRomanFont,
              color: rgb(0, 0.53, 0.71),
              rotate: degrees(-45)
            })
          }
        })
        this.pdfBytes = await pdfDoc.saveAsBase64()
        this.pdfBytes = 'data:application/pdf;base64,' + this.pdfBytes
      })
    },
    /**
     * 下载pdf - 高版本的chrome中不支持直接下载base64的文件，可在qq浏览器等中下载
     */
    downloadFile () {
      downloadAction(this.pdfBytes, 'test.pdf').then(() => {
        const fileInput = this.$refs.fileInput
        const imageInput = this.$refs.imageInput
        fileInput.value = ''
        imageInput.value = ''
      })
    }
  }
}
</script>
