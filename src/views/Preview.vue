<template>
  <div class="Preview">
    <div id="pdf"></div>

  </div>
</template>
<script>
import Pdfh5 from 'pdfh5'
import 'pdfh5/css/pdfh5.css'
export default {
  name: 'Preview',
  components: {

  },
  props: {

  },
  data () {
    return {
      pdfh5: null,
      // 可引入网络文件或者本地文件
      pdfUrl: '/test.pdf' // 如果引入本地pdf文件，需要将pdf放在public文件夹下，引用时使用绝对路径（/：表示public文件夹）
    }
  },
  computed: {

  },
  methods: {

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
    this.pdfh5.on('complete', function(status, msg, time) {
      console.log('状态:' + status + '，信息:' + msg + '，耗时:' + time + '毫秒')
    })
  },
  beforeDestroy () {

  }
}
</script>
<style lang="scss" scoped>
.Preview {
  height: 100vh;
  width: 100vw;
  #pdf {
    height: 100%;
    width: 100%;
    position: relative;
  }
}
</style>
