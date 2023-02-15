<template>
  <div id="app">
     <router-link to="/">pdf操作</router-link> |
      <router-link to="/Preview">预览</router-link> |
      <router-link to="/SignTest">签名</router-link> |
      <router-link to="/EditPic">操作图片</router-link>
    <router-view/>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
