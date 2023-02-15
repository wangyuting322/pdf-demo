<template>
  <div class="EditPic">
    <div ref='wrapper' class="wrapper">
      <img @touchstart.prevent.stop="start" @touchmove.prevent.stop="move" @touchend.prevent.stop="end" class="content" src="https://img-blog.csdnimg.cn/15061ed4efbb466694032cbb5a5b9bb5.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBATGl1WGlhb2RvbmcyMDIw,size_20,color_FFFFFF,t_70,g_se,x_16" />
    </div>
  </div>
</template>
<script>
export default {
  name: 'EditPic',
  components: {

  },
  props: {

  },
  data () {
    return {
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
      // 记录之前的放大倍数
      scaleXY: 1,
      // 记录本次的放大倍数
      scale: 1,
      // 是不是单个手指触摸(判断防止因为在触发双指时,两个手指都移动导致weizhi字段记录的坐标和双指不同时离开屏幕导致有触发单指的情况,这种情况导致的图片位置跳动)
      isOne: true,
      // 记录双指之间的距离
      startDistance: 1,
      moveDistance: 1
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
    start (e) {
      if (e.touches.length == 1) {
        // 是单指触摸,保存开始的位置
        this.isOne = true
        this.startDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
      } else if (e.touches.length == 2) {
        // 双指就保存一下现在的双指距离
        this.isOne = false
        this.startDistance = this.getDistance(
          {
            x: e.touches[0].screenX,
            y: e.touches[0].screenY
          },
          {
            x: e.touches[1].screenX,
            y: e.touches[1].screenY
          }
        )
      }
    },
    move (e) {
      if (e.touches.length == 1) {
        // 开始移动,防止双指放大之后离开一指导致图片跳动,更新一下图片位置
        if (!this.isOne) {
          this.isOne = true
          this.startDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
        }
        // 记录当前的位置
        this.moveDingwei = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }
        // 计算现在的单指移动位置（如果先scale再translate，则需要除以缩放倍数scaleXY，此处不做处理）
        // let moveX = (this.moveDingwei.x - this.startDingwei.x) / this.scaleXY
        // let moveY = (this.moveDingwei.y - this.startDingwei.y) / this.scaleXY
        let moveX = (this.moveDingwei.x - this.startDingwei.x)
        let moveY = (this.moveDingwei.y - this.startDingwei.y)
        // 计算与原图相比的距离（放大倍数为1下的位移距离）
        moveX += this.moveX
        moveY += this.moveY
        // 由于是先缩放再位移，所以位移的距离需要除以缩放倍数
        // const style = `transform:scale(${this.scaleXY}) translate(${moveX / this.scaleXY}px,${moveY / this.scaleXY}px);`
        // 此处先位移再缩放
        const style = `transform:translate(${moveX}px,${moveY}px) scale(${this.scaleXY});`
        e.target.style = style
      } else if (e.touches.length == 2) {
        // 记录当前的双指间距离
        this.moveDistance = this.getDistance(
          {
            x: e.touches[0].screenX,
            y: e.touches[0].screenY
          },
          {
            x: e.touches[1].screenX,
            y: e.touches[1].screenY
          }
        )
        // 本次放大倍数
        this.scale = this.moveDistance / this.startDistance
        // 与原图相比的放大倍数
        const scale = this.scale * this.scaleXY
        // 限制最大的倍数3，最小0.8
        // scale = scale < 0.8 ? 0.8 : (scale > 3 ? 3 : scale)
        // 如果是先缩放再位移，所以位移的距离需要除以缩放倍数
        // const style = `transform:scale(${scale}) translate(${this.moveX / scale}px,${this.moveY / scale}px);`
        const style = `transform:translate(${this.moveX}px,${this.moveY}px) scale(${scale});`
        e.target.style = style
      }
    },
    end (e) {
      if (this.isOne) {
        // 如果先scale再translate，则需要除以缩放倍数scaleXY，此处不做处理
        //  const moveX = (this.moveDingwei.x - this.startDingwei.x) / this.scaleXY + this.moveX
        // const moveY = (this.moveDingwei.y - this.startDingwei.y) / this.scaleXY + this.moveY
        const moveX = (this.moveDingwei.x - this.startDingwei.x) + this.moveX
        const moveY = (this.moveDingwei.y - this.startDingwei.y) + this.moveY
        this.moveX = moveX
        this.moveY = moveY
        // 防止误触发两次'end'
        this.moveDingwei = this.startDingwei
      } else {
        const scale = this.scale * this.scaleXY
        // 限制最大的倍数3，最小0.8
        // scale = scale < 0.8 ? 0.8 : (scale > 3 ? 3 : scale)
        this.scaleXY = scale
        // 防止误触发两次'end'
        this.scale = 1
      }
    }
  },
  watch: {

  },
  created () {

  },
  mounted () {

  },
  beforeDestroy () {

  }
}
</script>
<style lang="scss" scoped>
.EditPic {
  .content {
    transition: all 0s;
  }
}
</style>
