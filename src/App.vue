<template>
  <div id="app">
    <router-link to="/">pdf操作</router-link> |
    <router-link to="/Preview">预览</router-link> |
    <router-link to="/SignTest">签名</router-link> |
    <router-link to="/EditPic">操作图片</router-link> |
    <router-link to="/pdfSign">集合</router-link>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  .content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 18px);
  }
}
html,body{
  height: 100%;
  width: 100%;
}
</style>
